import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, RefreshCw, Clock } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketDataError } from "./MarketDataError";

interface MarketDataProps {
  symbol: string;
}

export const MarketData = ({ symbol }: MarketDataProps) => {
  const { data, loading, error, refetch, isCached } = useMarketData(symbol);
  
  // Check if error is a config error (expected when no provider configured)
  const isConfigError = error?.includes('configured') || error?.includes('API key') || error?.includes('provider');
  
  // Only show error component for unexpected errors, not config errors
  if (error && !data && !isConfigError) {
    return <MarketDataError error={error} onRetry={refetch} isRetrying={loading} />;
  }
  
  // Use demo data when no provider configured or data unavailable
  const isDemo = !data || isConfigError;
  const price = data?.price ?? 187.35;
  const change = data?.changePercent ?? 2.45;
  const volume = data?.volume ?? "52.3M";
  
  const isPositive = change >= 0;
  const trendColor = isPositive ? "text-bullish" : "text-bearish";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="p-5 bg-gradient-to-br from-card to-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Symbol</p>
            <Badge 
              variant={isDemo ? "secondary" : "default"}
              className={`text-xs ${!isDemo && 'bg-bullish/20 text-bullish border-bullish/30'}`}
            >
              {isDemo ? "Demo" : "Live"}
            </Badge>
            {isCached && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Cached
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight">{symbol}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-bullish/10' : 'bg-bearish/10'}`}>
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
          </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold font-mono tracking-tight">${price.toFixed(2)}</span>
          <span className={`text-lg font-semibold ${trendColor} flex items-center gap-1 px-2 py-1 rounded-lg ${
            isPositive ? 'bg-bullish/10' : 'bg-bearish/10'
          }`}>
            {isPositive ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Activity className="h-4 w-4" />
          <span className="font-medium">Volume: <span className="font-mono">{volume}</span></span>
        </div>
      </div>
    </Card>
  );
};
