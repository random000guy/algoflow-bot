import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUp, ArrowDown, Minus, Target, Shield, TrendingUp, 
  RefreshCw, ChevronDown, ChevronUp, Activity 
} from "lucide-react";
import { generateTradingSignal, TradingSignal, PriceData } from "@/lib/tradingAlgorithms";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMarketData } from "@/hooks/useMarketData";

interface EnhancedTradingSignalProps {
  symbol: string;
  priceData?: PriceData[];
}

// Generate mock price data for demo
const generateMockPriceData = (basePrice: number): PriceData[] => {
  const data: PriceData[] = [];
  let price = basePrice;
  
  for (let i = 0; i < 100; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.015);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
    
    data.push({
      time: new Date(Date.now() - (100 - i) * 5 * 60000).toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000) + 500000,
    });
    
    price = close;
  }
  
  return data;
};

export const EnhancedTradingSignal = ({ symbol, priceData }: EnhancedTradingSignalProps) => {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { data: marketData } = useMarketData(symbol);

  const calculateSignal = () => {
    setLoading(true);
    setTimeout(() => {
      // Use real market price if available, otherwise use a reasonable default
      const currentPrice = marketData?.price ?? 187.35;
      const data = priceData || generateMockPriceData(currentPrice);
      const newSignal = generateTradingSignal(data);
      setSignal(newSignal);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    calculateSignal();
  }, [symbol, priceData, marketData?.price]);

  if (!signal) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const getSignalConfig = () => {
    switch (signal.signal) {
      case "BUY":
        return {
          color: "bg-bullish text-bullish-foreground",
          glowClass: "glow-bullish",
          borderColor: "border-bullish/30",
          icon: ArrowUp,
          bgGradient: "from-bullish/20 to-bullish/5",
        };
      case "SELL":
        return {
          color: "bg-bearish text-bearish-foreground",
          glowClass: "glow-bearish",
          borderColor: "border-bearish/30",
          icon: ArrowDown,
          bgGradient: "from-bearish/20 to-bearish/5",
        };
      default:
        return {
          color: "bg-neutral text-neutral-foreground",
          glowClass: "glow-neutral",
          borderColor: "border-neutral/30",
          icon: Minus,
          bgGradient: "from-neutral/20 to-neutral/5",
        };
    }
  };

  const config = getSignalConfig();
  const SignalIcon = config.icon;

  const indicators = signal.indicators;

  return (
    <Card className={`p-6 bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} ${config.glowClass} transition-all duration-500`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Trading Signal</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={calculateSignal}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Badge variant="outline" className="font-mono">
            {symbol}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* Main Signal */}
        <div className={`${config.color} rounded-xl p-5 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-background/20">
              <SignalIcon className="h-8 w-8" />
            </div>
            <div>
              <span className="text-4xl font-bold">{signal.signal}</span>
              <p className="text-sm opacity-80 mt-1">Algorithm recommendation</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{signal.confidence}%</div>
            <p className="text-sm opacity-80">Confidence</p>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Signal Strength</span>
            <span className="font-semibold">{signal.confidence}%</span>
          </div>
          <Progress value={signal.confidence} className="h-2" />
        </div>

        {/* Risk/Reward Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Target
            </div>
            <p className="text-lg font-bold font-mono text-bullish">
              ${signal.targetPrice.toFixed(2)}
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Shield className="h-3 w-3" />
              Stop Loss
            </div>
            <p className="text-lg font-bold font-mono text-bearish">
              ${signal.stopLoss.toFixed(2)}
            </p>
          </div>
          <div className="bg-card/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              R/R Ratio
            </div>
            <p className="text-lg font-bold font-mono">
              {signal.riskReward.toFixed(2)}:1
            </p>
          </div>
        </div>

        {/* Reasons */}
        <div className="space-y-2">
          <p className="text-sm font-semibold">Analysis Reasons:</p>
          <ul className="space-y-1">
            {signal.reasons.map((reason, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Expandable Indicators */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Technical Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show Technical Details
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {indicators.rsi !== null && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">RSI (14)</span>
                  <span className={`font-mono font-semibold ${
                    indicators.rsi < 30 ? 'text-bullish' : indicators.rsi > 70 ? 'text-bearish' : ''
                  }`}>
                    {indicators.rsi.toFixed(1)}
                  </span>
                </div>
              )}
              {indicators.macd && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">MACD</span>
                  <span className={`font-mono font-semibold ${
                    indicators.macd.histogram > 0 ? 'text-bullish' : 'text-bearish'
                  }`}>
                    {indicators.macd.value.toFixed(2)}
                  </span>
                </div>
              )}
              {indicators.sma20 !== null && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">SMA 20</span>
                  <span className="font-mono font-semibold">${indicators.sma20.toFixed(2)}</span>
                </div>
              )}
              {indicators.sma50 !== null && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">SMA 50</span>
                  <span className="font-mono font-semibold">${indicators.sma50.toFixed(2)}</span>
                </div>
              )}
              {indicators.vwap !== null && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">VWAP</span>
                  <span className="font-mono font-semibold">${indicators.vwap.toFixed(2)}</span>
                </div>
              )}
              {indicators.atr !== null && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">ATR (14)</span>
                  <span className="font-mono font-semibold">${indicators.atr.toFixed(2)}</span>
                </div>
              )}
              {indicators.stochastic && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Stochastic %K</span>
                  <span className={`font-mono font-semibold ${
                    indicators.stochastic.k < 20 ? 'text-bullish' : indicators.stochastic.k > 80 ? 'text-bearish' : ''
                  }`}>
                    {indicators.stochastic.k.toFixed(1)}
                  </span>
                </div>
              )}
              {indicators.bollingerBands && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">BB Width</span>
                  <span className="font-mono font-semibold">
                    ${(indicators.bollingerBands.upper - indicators.bollingerBands.lower).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};
