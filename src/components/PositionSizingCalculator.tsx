import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertTriangle, TrendingUp, Shield, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PositionSizingResult {
  positionSize: number;
  shares: number;
  riskAmount: number;
  potentialProfit: number;
  riskRewardRatio: number;
  percentageOfPortfolio: number;
}

export const PositionSizingCalculator = () => {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskTolerance, setRiskTolerance] = useState(2);
  const [entryPrice, setEntryPrice] = useState(150);
  const [stopLoss, setStopLoss] = useState(145);
  const [targetPrice, setTargetPrice] = useState(165);
  const [maxPositionPercent, setMaxPositionPercent] = useState(25);

  const calculations = useMemo((): PositionSizingResult => {
    const riskAmount = (accountBalance * riskTolerance) / 100;
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    
    if (riskPerShare === 0) {
      return {
        positionSize: 0,
        shares: 0,
        riskAmount: 0,
        potentialProfit: 0,
        riskRewardRatio: 0,
        percentageOfPortfolio: 0,
      };
    }

    const optimalShares = Math.floor(riskAmount / riskPerShare);
    const maxPositionValue = (accountBalance * maxPositionPercent) / 100;
    const maxSharesByPosition = Math.floor(maxPositionValue / entryPrice);
    
    const finalShares = Math.min(optimalShares, maxSharesByPosition);
    const positionSize = finalShares * entryPrice;
    const potentialProfit = finalShares * (targetPrice - entryPrice);
    const actualRisk = finalShares * riskPerShare;
    const riskRewardRatio = Math.abs(targetPrice - entryPrice) / riskPerShare;
    const percentageOfPortfolio = (positionSize / accountBalance) * 100;

    return {
      positionSize,
      shares: finalShares,
      riskAmount: actualRisk,
      potentialProfit,
      riskRewardRatio,
      percentageOfPortfolio,
    };
  }, [accountBalance, riskTolerance, entryPrice, stopLoss, targetPrice, maxPositionPercent]);

  const getRiskLevel = () => {
    if (calculations.percentageOfPortfolio > 20) return { level: "High", color: "destructive" };
    if (calculations.percentageOfPortfolio > 10) return { level: "Medium", color: "warning" };
    return { level: "Low", color: "default" };
  };

  const riskLevel = getRiskLevel();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Calculator className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Position Sizing Calculator</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Optimal trade size based on risk management
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Account Balance
              </Label>
              <Input
                id="account"
                type="number"
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Per Trade: {riskTolerance}%
                </span>
                <span className="text-muted-foreground">
                  ${((accountBalance * riskTolerance) / 100).toFixed(2)}
                </span>
              </Label>
              <Slider
                value={[riskTolerance]}
                onValueChange={([v]) => setRiskTolerance(v)}
                min={0.5}
                max={5}
                step={0.5}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Max Position: {maxPositionPercent}%
                </span>
                <span className="text-muted-foreground">
                  ${((accountBalance * maxPositionPercent) / 100).toFixed(2)}
                </span>
              </Label>
              <Slider
                value={[maxPositionPercent]}
                onValueChange={([v]) => setMaxPositionPercent(v)}
                min={5}
                max={50}
                step={5}
                className="py-2"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="entry" className="text-xs">Entry Price</Label>
                <Input
                  id="entry"
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stop" className="text-xs">Stop Loss</Label>
                <Input
                  id="stop"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="target" className="text-xs">Target Price</Label>
                <Input
                  id="target"
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recommended Shares</span>
                <span className="text-2xl font-bold text-primary">{calculations.shares}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Position Size</span>
                <span className="text-lg font-semibold">${calculations.positionSize.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Portfolio Allocation</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{calculations.percentageOfPortfolio.toFixed(1)}%</span>
                  <Badge variant={riskLevel.color as any}>{riskLevel.level} Risk</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="text-xs text-muted-foreground mb-1">Risk Amount</div>
                <div className="text-lg font-bold text-destructive">
                  -${calculations.riskAmount.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-bullish/10 border border-bullish/20">
                <div className="text-xs text-muted-foreground mb-1">Potential Profit</div>
                <div className="text-lg font-bold text-bullish">
                  +${calculations.potentialProfit.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span className="text-sm">Risk/Reward Ratio</span>
              </div>
              <span className={`text-lg font-bold ${
                calculations.riskRewardRatio >= 2 ? "text-bullish" : 
                calculations.riskRewardRatio >= 1 ? "text-warning" : "text-destructive"
              }`}>
                1:{calculations.riskRewardRatio.toFixed(2)}
              </span>
            </div>

            {calculations.riskRewardRatio < 2 && (
              <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20 text-xs">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>Consider a R/R ratio of at least 2:1 for better risk management</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};