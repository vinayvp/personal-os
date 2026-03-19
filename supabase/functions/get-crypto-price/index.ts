import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY');
    if (!COINGECKO_API_KEY) {
      throw new Error('COINGECKO_API_KEY is not configured');
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('ids array is required');
    }

    const idsParam = ids.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=inr`;

    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinGecko API error [${response.status}]: ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
