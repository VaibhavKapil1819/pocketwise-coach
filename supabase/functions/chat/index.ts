import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { message } = await req.json();

    // Fetch user data for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: transactions } = await supabase
      .from('transactions')
      .select(`*, categories(name, icon)`)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50);

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Calculate totals
    const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
    const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
    const balance = totalIncome - totalExpense;

    // Category breakdown
    const categorySpending = transactions?.filter(t => t.type === 'expense').reduce((acc, t) => {
      const cat = t.categories?.name || 'Other';
      acc[cat] = (acc[cat] || 0) + parseFloat(t.amount.toString());
      return acc;
    }, {} as Record<string, number>);

    // Fetch recent chat history
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing chat message for user:', user.id);

    const messages = [
      {
        role: 'system',
        content: `You are Xpensify Assistant, a specialized AI financial advisor and companion.

CAPABILITIES:
- Analyze spending patterns and provide insights
- Answer questions about budgets, savings, and financial concepts
- Give personalized recommendations based on user data
- Explain financial terms in simple language
- Help track progress toward goals

USER'S FINANCIAL DATA:
Profile: ${JSON.stringify(profile, null, 2)}
Current Balance: ₹${balance.toLocaleString()}
Total Income: ₹${totalIncome.toLocaleString()}
Total Expenses: ₹${totalExpense.toLocaleString()}
Category Spending: ${JSON.stringify(categorySpending, null, 2)}
Active Goals: ${JSON.stringify(goals, null, 2)}
Recent Transactions (last 50): ${JSON.stringify(transactions?.slice(0, 10), null, 2)}

INSTRUCTIONS:
- Be friendly, concise, and actionable
- Use real data from the user's finances in your responses
- Format monetary amounts with ₹ symbol and commas
- Provide specific, personalized advice
- Keep responses under 150 words unless asked for details`
      },
      ...(chatHistory || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save messages to history
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: assistantMessage }
    ]);

    return new Response(
      JSON.stringify({ success: true, message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in chat:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});