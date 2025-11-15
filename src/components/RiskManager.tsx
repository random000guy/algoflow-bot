import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Shield, DollarSign, Percent } from "lucide-react";
import { useState } from "react";

interface RiskManagerProps {
  accountSize: number;
  onAccountSizeChange: (value: number) => void;
  riskPerTrade: number;
  onRiskPerTradeChange: (value: number) => void;
}

export const RiskManager = ({
  accountSize,
  onAccountSizeChange,
  riskPerTrade,
  onRiskPerTradeChange,
}: RiskManagerProps) => {
  const maxRisk = (accountSize * riskPerTrade) / 100;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Risk Management</h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="account-size" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Account Size
          </Label>
          <Input
            id="account-size"
            type="number"
            value={accountSize}
            onChange={(e) => onAccountSizeChange(Number(e.target.value))}
            className="font-mono"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Risk Per Trade
            </Label>
            <span className="text-sm font-bold font-mono">{riskPerTrade}%</span>
          </div>
          <Slider
            value={[riskPerTrade]}
            onValueChange={([value]) => onRiskPerTradeChange(value)}
            min={0.5}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5%</span>
            <span>5%</span>
          </div>
        </div>

        <div className="data-card">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Max Risk Per Trade</span>
            <span className="text-xl font-bold font-mono text-primary">${maxRisk.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
