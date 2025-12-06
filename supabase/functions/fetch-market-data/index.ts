import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  timestamp: string;
  provider?: string;
}

interface ProviderConfig {
  id: string;
  provider: string;
  api_key_encrypted: string;
  priority: number;
}

// Fetch data from a specific provider - returns data or throws error
async function fetchFromProvider(symbol: string, config: ProviderConfig): Promise<MarketData> {
  switch (config.provider) {
    case 'alpha_vantage': {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.api_key_encrypted}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        return {
          symbol: quote['01. symbol'],
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: quote['06. volume'],
          timestamp: quote['07. latest trading day'],
          provider: 'alpha_vantage',
        };
      }
      throw new Error('Invalid response from Alpha Vantage');
    }
      
    case 'finnhub': {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${config.api_key_encrypted}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Finnhub response for', symbol, ':', JSON.stringify(data));
      
      if (data.error) {
        throw new Error(`Finnhub API error: ${data.error}`);
      }
      
      if (data.c !== undefined && data.c !== null && data.c !== 0) {
        return {
          symbol: symbol,
          price: data.c,
          change: data.d || 0,
          changePercent: data.dp || 0,
          volume: data.v?.toString() || 'N/A',
          timestamp: new Date(data.t * 1000).toISOString(),
          provider: 'finnhub',
        };
      }
      throw new Error(`No data available for ${symbol}`);
    }

    case 'polygon':
    case 'massive': {
      const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${config.api_key_encrypted}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Polygon/Massive response for', symbol, ':', JSON.stringify(data));
      
      if (data.status === 'ERROR' || data.error) {
        throw new Error(`Polygon API error: ${data.error || data.message}`);
      }
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          symbol: symbol,
          price: result.c,
          change: result.c - result.o,
          changePercent: ((result.c - result.o) / result.o) * 100,
          volume: result.v?.toString() || 'N/A',
          timestamp: new Date(result.t).toISOString(),
          provider: config.provider,
        };
      }
      throw new Error(`No data available for ${symbol}`);
    }

    case 'iex_cloud': {
      const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${config.api_key_encrypted}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('IEX Cloud response for', symbol, ':', JSON.stringify(data));
      
      if (data.error) {
        throw new Error(`IEX Cloud API error: ${data.error}`);
      }
      
      if (data.latestPrice) {
        return {
          symbol: data.symbol,
          price: data.latestPrice,
          change: data.change || 0,
          changePercent: data.changePercent ? data.changePercent * 100 : 0,
          volume: data.volume?.toString() || 'N/A',
          timestamp: data.latestUpdate ? new Date(data.latestUpdate).toISOString() : new Date().toISOString(),
          provider: 'iex_cloud',
        };
      }
      throw new Error(`No data available for ${symbol}`);
    }
      
    default:
      throw new Error(`Provider ${config.provider} not supported`);
  }
}

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

    // Get ALL user's market data configs ordered by priority
    const { data: configs, error: configError } = await supabase
      .from('market_data_configs')
      .select('id, provider, api_key_encrypted, priority')
      .eq('user_id', user.id)
      .not('api_key_encrypted', 'is', null)
      .order('priority', { ascending: true });

    if (configError) {
      console.error('Config fetch error:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch market data configuration.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No market data providers configured. Please add an API key in Settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try each provider in priority order until one succeeds
    const errors: string[] = [];
    
    for (const config of configs) {
      try {
        console.log(`Trying provider: ${config.provider} (priority: ${config.priority})`);
        const marketData = await fetchFromProvider(symbol, config as ProviderConfig);
        
        // Success! Return the data with provider info
        console.log(`Success with provider: ${config.provider}`);
        return new Response(
          JSON.stringify(marketData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.log(`Provider ${config.provider} failed: ${errorMsg}`);
        errors.push(`${config.provider}: ${errorMsg}`);
        // Continue to next provider
      }
    }

    // All providers failed
    return new Response(
      JSON.stringify({ 
        error: 'All providers failed',
        details: errors,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-market-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});