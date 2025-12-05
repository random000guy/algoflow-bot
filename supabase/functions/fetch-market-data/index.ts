import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active market data config
    const { data: config, error: configError } = await supabase
      .from('market_data_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !config || !config.api_key_encrypted) {
      return new Response(
        JSON.stringify({ 
          error: 'No active market data provider configured. Please add an API key in Settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data based on provider
    let marketData;
    
    switch (config.provider) {
      case 'alpha_vantage':
        const avUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.api_key_encrypted}`;
        const avResponse = await fetch(avUrl);
        const avData = await avResponse.json();
        
        if (avData['Global Quote']) {
          const quote = avData['Global Quote'];
          marketData = {
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: quote['06. volume'],
            timestamp: quote['07. latest trading day'],
          };
        } else {
          return new Response(
            JSON.stringify({ error: 'Invalid response from Alpha Vantage' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
        
      case 'finnhub':
        const fhUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${config.api_key_encrypted}`;
        const fhResponse = await fetch(fhUrl);
        const fhData = await fhResponse.json();
        
        console.log('Finnhub response for', symbol, ':', JSON.stringify(fhData));
        
        // Check for error response
        if (fhData.error) {
          return new Response(
            JSON.stringify({ error: `Finnhub API error: ${fhData.error}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Check if we have valid price data
        if (fhData.c !== undefined && fhData.c !== null && fhData.c !== 0) {
          marketData = {
            symbol: symbol,
            price: fhData.c,
            change: fhData.d || 0,
            changePercent: fhData.dp || 0,
            volume: fhData.v?.toString() || 'N/A',
            timestamp: new Date(fhData.t * 1000).toISOString(),
          };
        } else {
          return new Response(
            JSON.stringify({ 
              error: `No data available for ${symbol}. The symbol may be invalid or market is closed.` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'polygon':
      case 'massive':
        const pgUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${config.api_key_encrypted}`;
        const pgResponse = await fetch(pgUrl);
        const pgData = await pgResponse.json();
        
        console.log('Polygon/Massive response for', symbol, ':', JSON.stringify(pgData));
        
        if (pgData.status === 'ERROR' || pgData.error) {
          return new Response(
            JSON.stringify({ error: `Polygon API error: ${pgData.error || pgData.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (pgData.results && pgData.results.length > 0) {
          const result = pgData.results[0];
          marketData = {
            symbol: symbol,
            price: result.c,
            change: result.c - result.o,
            changePercent: ((result.c - result.o) / result.o) * 100,
            volume: result.v?.toString() || 'N/A',
            timestamp: new Date(result.t).toISOString(),
          };
        } else {
          return new Response(
            JSON.stringify({ 
              error: `No data available for ${symbol}. The symbol may be invalid.` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'iex_cloud':
        const iexUrl = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${config.api_key_encrypted}`;
        const iexResponse = await fetch(iexUrl);
        const iexData = await iexResponse.json();
        
        console.log('IEX Cloud response for', symbol, ':', JSON.stringify(iexData));
        
        if (iexData.error) {
          return new Response(
            JSON.stringify({ error: `IEX Cloud API error: ${iexData.error}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (iexData.latestPrice) {
          marketData = {
            symbol: iexData.symbol,
            price: iexData.latestPrice,
            change: iexData.change || 0,
            changePercent: iexData.changePercent ? iexData.changePercent * 100 : 0,
            volume: iexData.volume?.toString() || 'N/A',
            timestamp: iexData.latestUpdate ? new Date(iexData.latestUpdate).toISOString() : new Date().toISOString(),
          };
        } else {
          return new Response(
            JSON.stringify({ 
              error: `No data available for ${symbol}.` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Provider ${config.provider} not yet supported` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(marketData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-market-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
