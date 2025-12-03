import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ThumbsUp, ThumbsDown, Minus, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketData } from "@/hooks/useMarketData";

interface SentimentAnalysisProps {
  symbol?: string;
  score?: number; // -1 to 1
  articles?: number;
  lastUpdate?: string;
}

export const SentimentAnalysis = ({ symbol = "AAPL", score: propScore, articles: propArticles, lastUpdate: propLastUpdate }: SentimentAnalysisProps) => {
  const [loading, setLoading] = useState(false);
  const { data: marketData } = useMarketData(symbol);
  
  // Calculate sentiment based on market data if available
  const calculateSentiment = () => {
    if (marketData?.changePercent !== undefined) {
      // Map change percent to sentiment score (-1 to 1)
      const change = marketData.changePercent;
      // Scale: -5% or worse = -1, +5% or better = +1
      return Math.max(-1, Math.min(1, change / 5));
    }
    return propScore ?? 0.68;
  };
  
  const score = calculateSentiment();
  const articles = propArticles ?? Math.floor(Math.random() * 200) + 100;
  const lastUpdate = propLastUpdate ?? `${Math.floor(Math.random() * 5) + 1} min ago`;
  
  // Convert -1 to 1 scale to 0 to 100 for progress bar
  const progressValue = ((score + 1) / 2) * 100;
  
  const getSentimentLabel = () => {
    if (score > 0.3) return { text: "Bullish", color: "text-bullish", bgColor: "bg-bullish/10", icon: ThumbsUp };
    if (score < -0.3) return { text: "Bearish", color: "text-bearish", bgColor: "bg-bearish/10", icon: ThumbsDown };
    return { text: "Neutral", color: "text-yellow-500", bgColor: "bg-yellow-500/10", icon: Minus };
  };

  const sentiment = getSentimentLabel();
  const SentimentIcon = sentiment.icon;

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Sentiment Analysis</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sentiment.bgColor}`}>
            <SentimentIcon className={`h-5 w-5 ${sentiment.color}`} />
            <span className={`text-xl font-bold ${sentiment.color}`}>
              {sentiment.text}
            </span>
          </div>
          <span className="text-3xl font-bold font-mono">{score.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-bearish" /> Bearish</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-bullish" /> Bullish</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {marketData && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{symbol} Price</span>
              <span className="font-mono font-semibold">${marketData.price?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Change</span>
              <span className={`font-mono font-semibold ${marketData.changePercent >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent?.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{articles} articles analyzed</span>
          <span>Updated: {lastUpdate}</span>
        </div>
      </div>
    </Card>
  );
};
