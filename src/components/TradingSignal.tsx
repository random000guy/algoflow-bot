import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus, Target } from "lucide-react";

interface TradingSignalProps {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0 to 100
  reason: string;
  targetPrice?: number;
  stopLoss?: number;
}

export const TradingSignal = ({ signal, confidence, reason, targetPrice, stopLoss }: TradingSignalProps) => {
  const getSignalConfig = () => {
    switch (signal) {
      case "BUY":
        return {
          color: "bg-bullish text-bullish-foreground",
          glowClass: "glow-bullish",
          icon: ArrowUp,
          badgeVariant: "default" as const,
        };
      case "SELL":
        return {
          color: "bg-bearish text-bearish-foreground",
          glowClass: "glow-bearish",
          icon: ArrowDown,
          badgeVariant: "destructive" as const,
        };
      default:
        return {
          color: "bg-neutral text-neutral-foreground",
          glowClass: "glow-neutral",
          icon: Minus,
          badgeVariant: "secondary" as const,
        };
    }
  };

  const config = getSignalConfig();
  const SignalIcon = config.icon;

  return (
    <Card className={`p-6 bg-card border-border ${config.glowClass} transition-all duration-500 animate-pulse-slow`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trading Signal</h3>
        <Badge variant={config.badgeVariant} className="text-sm font-bold">
          {confidence}% confidence
        </Badge>
      </div>

      <div className="space-y-4">
        <div className={`${config.color} rounded-lg p-4 flex items-center justify-center gap-3`}>
          <SignalIcon className="h-8 w-8" />
          <span className="text-4xl font-bold">{signal}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Reason:</p>
          <p className="text-sm">{reason}</p>
        </div>

        {(targetPrice || stopLoss) && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            {targetPrice && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Target
                </p>
                <p className="text-lg font-bold font-mono text-bullish">${targetPrice.toFixed(2)}</p>
              </div>
            )}
            {stopLoss && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Stop Loss
                </p>
                <p className="text-lg font-bold font-mono text-bearish">${stopLoss.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
