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

    const { topic, question } = await req.json();

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Providing financial education for user:', user.id);

    let prompt = '';
    if (topic) {
      prompt = `Explain the financial concept of "${topic}" in simple, easy-to-understand terms. 
      Use examples and analogies. Keep it under 200 words. Make it actionable.`;
    } else if (question) {
      prompt = question;
    } else {
      prompt = 'Provide a helpful financial tip for today.';
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
          {
            role: 'system',
            content: `You are a friendly financial literacy coach. Explain financial concepts in simple, 
            relatable terms. Use examples, analogies, and actionable advice. Be encouraging and motivating.
            
            User profile:
            Income range: ${profile?.income_range || 'Not specified'}
            Savings goal: ${profile?.savings_goal || 'Not specified'}
            Risk comfort: ${profile?.risk_comfort || 'Not specified'}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices[0].message.content;

    // Award XP for learning
    const xpGained = 10;
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .update({ 
        xp: (profile?.xp || 0) + xpGained,
        level: Math.floor(((profile?.xp || 0) + xpGained) / 100) + 1
      })
      .eq('id', user.id)
      .select()
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        explanation,
        xpGained,
        newXP: updatedProfile?.xp,
        newLevel: updatedProfile?.level
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in financial-coach:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});