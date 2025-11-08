import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing receipt with AI...');

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and extract ALL transactions. This could be a single receipt, bill, or a bank statement with multiple transactions. For bank statements, extract each transaction separately with its date, merchant/payee, amount, and type (income for credits/deposits, expense for debits/withdrawals).'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_transactions',
              description: 'Extract one or more transactions from a receipt, bill, or bank statement image',
              parameters: {
                type: 'object',
                properties: {
                  transactions: {
                    type: 'array',
                    description: 'Array of transactions found in the image',
                    items: {
                      type: 'object',
                      properties: {
                        merchant: {
                          type: 'string',
                          description: 'Store, vendor, or payee name'
                        },
                        amount: {
                          type: 'number',
                          description: 'Transaction amount'
                        },
                        date: {
                          type: 'string',
                          description: 'Date in YYYY-MM-DD format'
                        },
                        category: {
                          type: 'string',
                          enum: ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Other'],
                          description: 'Transaction category'
                        },
                        description: {
                          type: 'string',
                          description: 'Brief description of the transaction'
                        },
                        type: {
                          type: 'string',
                          enum: ['income', 'expense'],
                          description: 'Transaction type - income (credit/deposit) or expense (debit/withdrawal)'
                        }
                      },
                      required: ['merchant', 'amount', 'date', 'category', 'description', 'type'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['transactions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_transactions' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function.arguments) {
      throw new Error('No structured data returned from AI');
    }
    
    console.log('AI response:', toolCall.function.arguments);
    
    // Parse the structured JSON response from tool call
    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-receipt:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});