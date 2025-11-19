import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsArticle {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  source: string;
  sentiment: {
    label: string;
    score: number;
  };
}

interface NewsArticlesProps {
  symbol: string;
}

export const NewsArticles = ({ symbol }: NewsArticlesProps) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchNews = async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('fetch-market-news', {
        body: { symbol },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setArticles(data.articles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news';
      toast({
        title: "News Unavailable",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  const getSentimentColor = (label: string) => {
    switch (label.toLowerCase()) {
      case 'bullish':
      case 'positive':
        return 'text-bullish bg-bullish/10';
      case 'bearish':
      case 'negative':
        return 'text-bearish bg-bearish/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Latest News</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchNews}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {articles.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No news articles available. Configure a market data provider in Settings to view news.
        </p>
      )}

      <div className="space-y-4">
        {articles.slice(0, 5).map((article, index) => (
          <div
            key={index}
            className="border-b border-border last:border-0 pb-4 last:pb-0"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-primary transition-colors flex items-start gap-1 flex-1"
              >
                {article.title}
                <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
              </a>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {article.summary}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {article.source}
              </Badge>
              {article.sentiment && (
                <Badge className={`text-xs ${getSentimentColor(article.sentiment.label)}`}>
                  {article.sentiment.label}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(article.time_published)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
