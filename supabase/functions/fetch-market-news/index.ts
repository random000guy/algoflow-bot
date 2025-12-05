import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching news for symbol:', symbol);

    // Get user's active market data config (pick most recently updated if multiple)
    const { data: configs, error: configError } = await supabase
      .from('market_data_configs')
      .select('provider, api_key_encrypted')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (configError) {
      console.error('Config fetch error:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch market data configuration.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configs && configs.length > 0 ? configs[0] : null;

    if (!config || !config.api_key_encrypted) {
      console.error('No active config found');
      return new Response(
        JSON.stringify({ 
          error: 'No active market data provider configured. Please add an API key in Settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Using provider for news:', config.provider);

    let newsData;

    switch (config.provider) {
      case 'alpha_vantage':
        const avNewsUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${config.api_key_encrypted}`;
        const avResponse = await fetch(avNewsUrl);
        const avData = await avResponse.json();
        
        if (avData.Information || avData['Error Message']) {
          throw new Error(avData.Information || avData['Error Message']);
        }

        newsData = {
          articles: (avData.feed || []).map((item: any) => ({
            title: item.title,
            url: item.url,
            time_published: item.time_published,
            authors: item.authors || [],
            summary: item.summary,
            source: item.source,
            sentiment: {
              label: item.overall_sentiment_label || 'Neutral',
              score: parseFloat(item.overall_sentiment_score || '0')
            }
          }))
        };
        break;

      case 'finnhub':
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fromDate = lastWeek.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];
        
        const fhNewsUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${config.api_key_encrypted}`;
        const fhResponse = await fetch(fhNewsUrl);
        const fhData = await fhResponse.json();
        
        if (fhData.error) {
          throw new Error(fhData.error);
        }

        newsData = {
          articles: (fhData || []).map((item: any) => ({
            title: item.headline,
            url: item.url,
            time_published: new Date(item.datetime * 1000).toISOString(),
            authors: [],
            summary: item.summary,
            source: item.source,
            sentiment: {
              label: 'Neutral',
              score: 0
            }
          }))
        };
        break;

      default:
        throw new Error('Unsupported provider');
    }

    console.log(`Successfully fetched ${newsData.articles.length} news articles`);

    return new Response(
      JSON.stringify(newsData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-market-news:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch news' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
