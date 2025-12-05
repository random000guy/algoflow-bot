import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Activity, BarChart3, Grid3X3 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface RiskMetrics {
  var95: number;
  var99: number;
  cvar: number;
  portfolioBeta: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
}

interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
}

const PORTFOLIO_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"];

// Generate simulated historical returns
const generateReturns = (days: number): number[] => {
  const returns: number[] = [];
  for (let i = 0; i < days; i++) {
    // Normal distribution approximation
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(z * 0.02 + 0.0005); // ~2% daily vol, slight positive drift
  }
  return returns;
};

// Calculate Value at Risk
const calculateVaR = (returns: number[], confidence: number): number => {
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return Math.abs(sorted[index]) * 100;
};

// Calculate Conditional VaR (Expected Shortfall)
const calculateCVaR = (returns: number[], confidence: number): number => {
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidence) * sorted.length);
  const tailReturns = sorted.slice(0, cutoff);
  const avg = tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length;
  return Math.abs(avg) * 100;
};

// Calculate correlation between two return series
const calculateCorrelation = (returns1: number[], returns2: number[]): number => {
  const n = Math.min(returns1.length, returns2.length);
  const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let cov = 0, var1 = 0, var2 = 0;
  for (let i = 0; i < n; i++) {
    const d1 = returns1[i] - mean1;
    const d2 = returns2[i] - mean2;
    cov += d1 * d2;
    var1 += d1 * d1;
    var2 += d2 * d2;
  }
  
  return cov / Math.sqrt(var1 * var2);
};

// Calculate portfolio beta against market
const calculateBeta = (portfolioReturns: number[], marketReturns: number[]): number => {
  const n = Math.min(portfolioReturns.length, marketReturns.length);
  const meanP = portfolioReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanM = marketReturns.slice(0, n).reduce((a, b) => a + b, 0) / n;
  
  let cov = 0, varM = 0;
  for (let i = 0; i < n; i++) {
    const dP = portfolioReturns[i] - meanP;
    const dM = marketReturns[i] - meanM;
    cov += dP * dM;
    varM += dM * dM;
  }
  
  return cov / varM;
};

export const RiskAnalytics = () => {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [portfolioValue] = useState(125000);

  const days = timeframe === "1M" ? 22 : timeframe === "3M" ? 66 : timeframe === "6M" ? 132 : 252;

  // Generate data
  const { metrics, correlationMatrix, varDistribution, returnsData } = useMemo(() => {
    const portfolioReturns = generateReturns(days);
    const marketReturns = generateReturns(days);
    
    // Generate returns for each symbol
    const symbolReturns: Record<string, number[]> = {};
    PORTFOLIO_SYMBOLS.forEach(symbol => {
      symbolReturns[symbol] = generateReturns(days);
    });

    // Calculate metrics
    const var95 = calculateVaR(portfolioReturns, 0.95);
    const var99 = calculateVaR(portfolioReturns, 0.99);
    const cvar = calculateCVaR(portfolioReturns, 0.95);
    const portfolioBeta = calculateBeta(portfolioReturns, marketReturns);
    
    const volatility = Math.sqrt(
      portfolioReturns.reduce((sum, r) => sum + r * r, 0) / portfolioReturns.length
    ) * Math.sqrt(252) * 100;
    
    const avgReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
    const sharpeRatio = (avgReturn * 252 - 0.02) / (volatility / 100);
    
    // Max drawdown
    let peak = 1;
    let maxDD = 0;
    let equity = 1;
    portfolioReturns.forEach(r => {
      equity *= (1 + r);
      if (equity > peak) peak = equity;
      const dd = (peak - equity) / peak;
      if (dd > maxDD) maxDD = dd;
    });

    const metrics: RiskMetrics = {
      var95,
      var99,
      cvar,
      portfolioBeta,
      sharpeRatio,
      volatility,
      maxDrawdown: maxDD * 100,
    };

    // Correlation matrix
    const correlationMatrix: CorrelationData[] = [];
    for (let i = 0; i < PORTFOLIO_SYMBOLS.length; i++) {
      for (let j = i; j < PORTFOLIO_SYMBOLS.length; j++) {
        correlationMatrix.push({
          symbol1: PORTFOLIO_SYMBOLS[i],
          symbol2: PORTFOLIO_SYMBOLS[j],
          correlation: i === j ? 1 : calculateCorrelation(
            symbolReturns[PORTFOLIO_SYMBOLS[i]],
            symbolReturns[PORTFOLIO_SYMBOLS[j]]
          ),
        });
      }
    }

    // VaR distribution histogram
    const sorted = [...portfolioReturns].sort((a, b) => a - b);
    const bins: { range: string; count: number; isVaR: boolean }[] = [];
    const min = sorted[0] * 100;
    const max = sorted[sorted.length - 1] * 100;
    const binWidth = (max - min) / 20;
    
    for (let i = 0; i < 20; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = sorted.filter(r => r * 100 >= binStart && r * 100 < binEnd).length;
      bins.push({
        range: `${binStart.toFixed(1)}%`,
        count,
        isVaR: binEnd < -var95,
      });
    }

    // Returns time series
    let cumReturn = 0;
    const returnsData = portfolioReturns.map((r, i) => {
      cumReturn += r * 100;
      return {
        day: i + 1,
        dailyReturn: r * 100,
        cumReturn,
      };
    });

    return { metrics, correlationMatrix, varDistribution: bins, returnsData };
  }, [days]);

  const getCorrelationColor = (corr: number) => {
    if (corr >= 0.7) return "bg-bullish/80";
    if (corr >= 0.3) return "bg-bullish/40";
    if (corr >= -0.3) return "bg-muted";
    if (corr >= -0.7) return "bg-bearish/40";
    return "bg-bearish/80";
  };

  const getRiskLevel = (var95: number) => {
    if (var95 < 2) return { level: "Low", color: "text-bullish" };
    if (var95 < 4) return { level: "Medium", color: "text-warning" };
    return { level: "High", color: "text-bearish" };
  };

  const riskLevel = getRiskLevel(metrics.var95);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Risk Analytics</h2>
            <p className="text-sm text-muted-foreground">Portfolio risk metrics and analysis</p>
          </div>
        </div>
        <Select value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1M">1 Month</SelectItem>
            <SelectItem value="3M">3 Months</SelectItem>
            <SelectItem value="6M">6 Months</SelectItem>
            <SelectItem value="1Y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">VaR (95%)</p>
          <p className="text-2xl font-bold text-bearish">{metrics.var95.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground">${(portfolioValue * metrics.var95 / 100).toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">VaR (99%)</p>
          <p className="text-2xl font-bold text-bearish">{metrics.var99.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground">${(portfolioValue * metrics.var99 / 100).toLocaleString()}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">CVaR (ES)</p>
          <p className="text-2xl font-bold text-bearish">{metrics.cvar.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground">Expected Shortfall</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">Portfolio Beta</p>
          <p className={`text-2xl font-bold ${metrics.portfolioBeta > 1 ? 'text-warning' : 'text-bullish'}`}>
            {metrics.portfolioBeta.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">vs S&P 500</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">Volatility</p>
          <p className="text-2xl font-bold">{metrics.volatility.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Annualized</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">Sharpe Ratio</p>
          <p className={`text-2xl font-bold ${metrics.sharpeRatio > 1 ? 'text-bullish' : metrics.sharpeRatio > 0 ? 'text-warning' : 'text-bearish'}`}>
            {metrics.sharpeRatio.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Risk-adjusted</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-card to-card/50">
          <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
          <p className="text-2xl font-bold text-bearish">{metrics.maxDrawdown.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Peak to trough</p>
        </Card>
      </div>

      {/* Risk Level Banner */}
      <Card className={`p-4 border-2 ${riskLevel.level === 'High' ? 'border-bearish/50 bg-bearish/5' : riskLevel.level === 'Medium' ? 'border-warning/50 bg-warning/5' : 'border-bullish/50 bg-bullish/5'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${riskLevel.color}`} />
            <div>
              <p className="font-semibold">Overall Risk Level: <span className={riskLevel.color}>{riskLevel.level}</span></p>
              <p className="text-sm text-muted-foreground">
                Based on current portfolio composition and market conditions
              </p>
            </div>
          </div>
          <Badge variant={riskLevel.level === 'High' ? 'destructive' : riskLevel.level === 'Medium' ? 'secondary' : 'default'}>
            {riskLevel.level} Risk
          </Badge>
        </div>
      </Card>

      <Tabs defaultValue="var" className="space-y-4">
        <TabsList className="bg-card/50">
          <TabsTrigger value="var" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            VaR Distribution
          </TabsTrigger>
          <TabsTrigger value="correlation" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Correlation Matrix
          </TabsTrigger>
          <TabsTrigger value="returns" className="gap-2">
            <Activity className="h-4 w-4" />
            Returns Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="var">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Return Distribution & Value at Risk</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Histogram of daily returns with VaR threshold highlighted. The red bars represent returns in the tail below the 95% VaR.
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={varDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {varDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.isVaR ? "hsl(var(--bearish))" : "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="correlation">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Asset Correlation Matrix</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Pairwise correlations between portfolio holdings. Lower correlation improves diversification.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-sm font-medium text-muted-foreground"></th>
                    {PORTFOLIO_SYMBOLS.map(symbol => (
                      <th key={symbol} className="p-2 text-center text-sm font-medium">{symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_SYMBOLS.map((symbol1, i) => (
                    <tr key={symbol1}>
                      <td className="p-2 text-sm font-medium">{symbol1}</td>
                      {PORTFOLIO_SYMBOLS.map((symbol2, j) => {
                        const data = correlationMatrix.find(
                          c => (c.symbol1 === symbol1 && c.symbol2 === symbol2) ||
                               (c.symbol1 === symbol2 && c.symbol2 === symbol1)
                        );
                        const corr = data?.correlation ?? 0;
                        return (
                          <td key={symbol2} className="p-1">
                            <div
                              className={`p-2 text-center text-xs font-mono rounded ${getCorrelationColor(corr)} ${
                                i === j ? 'font-bold' : ''
                              }`}
                            >
                              {corr.toFixed(2)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-bearish/80 rounded" /> Strong Negative</span>
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-muted rounded" /> Uncorrelated</span>
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-bullish/80 rounded" /> Strong Positive</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cumulative Returns</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={returnsData}>
                <defs>
                  <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}%`} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Return"]}
                />
                <Area
                  type="monotone"
                  dataKey="cumReturn"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReturn)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
