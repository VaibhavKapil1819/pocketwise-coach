import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { type, topic } = await req.json();

    // Fetch user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, type, date, categories!inner(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    let prompt = '';
    let xpGained = 0;

    if (type === 'concept') {
      xpGained = 15;
      prompt = `Explain the financial concept: "${topic}" in simple terms with a real-world example. Keep it under 150 words.`;
    } else if (type === 'news') {
      xpGained = 10;
      prompt = `Generate a brief trending finance news insight about "${topic}" with actionable advice. Keep it under 100 words.`;
    } else if (type === 'quiz') {
      xpGained = 20;
      prompt = `Create a single multiple-choice quiz question about "${topic}" with 4 options and explain the correct answer. Format: Question | A) B) C) D) | Correct: X | Explanation`;
    } else if (type === 'personalized') {
      xpGained = 25;
      const totalSpent = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0;
      const expenses = transactions?.filter(t => t.type === 'expense') || [];
      const topCategory = expenses.length > 0 && expenses[0].categories ? (expenses[0].categories as any).name : 'general';
      prompt = `Based on user's recent spending (${totalSpent} total, mostly on ${topCategory}), provide personalized financial advice about "${topic}". Keep it actionable and under 150 words.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a friendly financial literacy coach. Be concise, practical, and encouraging.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Update user XP and level
    const newXp = (profile?.xp || 0) + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;

    await supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({ 
        content, 
        xpGained,
        newXp,
        newLevel 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
