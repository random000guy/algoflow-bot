import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, Shield, Zap } from "lucide-react";

interface PerformanceData {
  date: string;
  value: number;
  pnl: number;
  drawdown: number;
}

// Calculate Sharpe Ratio
const calculateSharpeRatio = (returns: number[], riskFreeRate: number = 0.02): number => {
  if (returns.length < 2) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return ((avgReturn * 252) - riskFreeRate) / (stdDev * Math.sqrt(252));
};

// Calculate Sortino Ratio (only considers downside volatility)
const calculateSortinoRatio = (returns: number[], riskFreeRate: number = 0.02): number => {
  if (returns.length < 2) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < 0);
  if (downsideReturns.length === 0) return avgReturn > 0 ? 99 : 0;
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length;
  const downsideStdDev = Math.sqrt(downsideVariance);
  if (downsideStdDev === 0) return 0;
  return ((avgReturn * 252) - riskFreeRate) / (downsideStdDev * Math.sqrt(252));
};

// Calculate Maximum Drawdown
const calculateMaxDrawdown = (values: number[]): { maxDrawdown: number; drawdownSeries: number[] } => {
  let peak = values[0];
  let maxDrawdown = 0;
  const drawdownSeries: number[] = [];

  for (const value of values) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    drawdownSeries.push(-drawdown);
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return { maxDrawdown, drawdownSeries };
};

// Calculate Calmar Ratio
const calculateCalmarRatio = (annualReturn: number, maxDrawdown: number): number => {
  if (maxDrawdown === 0) return 0;
  return annualReturn / maxDrawdown;
};

export const PortfolioAnalytics = () => {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("3M");

  // Generate simulated historical data
  const historicalData = useMemo(() => {
    const days = timeframe === "1M" ? 30 : timeframe === "3M" ? 90 : timeframe === "6M" ? 180 : timeframe === "1Y" ? 365 : 730;
    const data: PerformanceData[] = [];
    let value = 100000;
    const values: number[] = [];
    
    for (let i = 0; i < days; i++) {
      const dailyReturn = (Math.random() - 0.48) * 0.03; // Slight positive bias
      value = value * (1 + dailyReturn);
      values.push(value);
      
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(value * 100) / 100,
        pnl: Math.round((value - 100000) * 100) / 100,
        drawdown: 0,
      });
    }

    // Calculate drawdown series
    const { drawdownSeries, maxDrawdown } = calculateMaxDrawdown(values);
    data.forEach((d, i) => {
      d.drawdown = Math.round(drawdownSeries[i] * 100) / 100;
    });

    return { data, values, maxDrawdown };
  }, [timeframe]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const { values, maxDrawdown } = historicalData;
    const dailyReturns = values.slice(1).map((v, i) => (v - values[i]) / values[i]);
    
    const totalReturn = ((values[values.length - 1] - values[0]) / values[0]) * 100;
    const annualizedReturn = totalReturn * (365 / values.length);
    const sharpeRatio = calculateSharpeRatio(dailyReturns);
    const sortinoRatio = calculateSortinoRatio(dailyReturns);
    const calmarRatio = calculateCalmarRatio(annualizedReturn, maxDrawdown);
    
    const winningDays = dailyReturns.filter(r => r > 0).length;
    const winRate = (winningDays / dailyReturns.length) * 100;
    
    const avgWin = dailyReturns.filter(r => r > 0).reduce((a, b) => a + b, 0) / winningDays || 0;
    const avgLoss = Math.abs(dailyReturns.filter(r => r < 0).reduce((a, b) => a + b, 0) / (dailyReturns.length - winningDays)) || 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 99 : 0;

    return {
      totalReturn: Math.round(totalReturn * 100) / 100,
      annualizedReturn: Math.round(annualizedReturn * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      calmarRatio: Math.round(calmarRatio * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      currentValue: Math.round(historicalData.values[historicalData.values.length - 1] * 100) / 100,
      totalPnL: Math.round((historicalData.values[historicalData.values.length - 1] - 100000) * 100) / 100,
    };
  }, [historicalData]);

  const getRatingColor = (value: number, type: "sharpe" | "sortino" | "winrate" | "drawdown") => {
    if (type === "sharpe" || type === "sortino") {
      if (value >= 2) return "text-bullish";
      if (value >= 1) return "text-yellow-500";
      return "text-bearish";
    }
    if (type === "winrate") {
      if (value >= 55) return "text-bullish";
      if (value >= 45) return "text-yellow-500";
      return "text-bearish";
    }
    if (type === "drawdown") {
      if (value <= 10) return "text-bullish";
      if (value <= 20) return "text-yellow-500";
      return "text-bearish";
    }
    return "text-muted-foreground";
  };

  const getRatingBadge = (value: number, type: "sharpe" | "sortino") => {
    if (value >= 2) return { label: "Excellent", variant: "default" as const };
    if (value >= 1) return { label: "Good", variant: "secondary" as const };
    if (value >= 0) return { label: "Average", variant: "outline" as const };
    return { label: "Poor", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold">${metrics.currentValue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${metrics.totalPnL >= 0 ? 'from-bullish/10 to-bullish/5 border-bullish/20' : 'from-bearish/10 to-bearish/5 border-bearish/20'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {metrics.totalPnL >= 0 ? <TrendingUp className="h-4 w-4 text-bullish" /> : <TrendingDown className="h-4 w-4 text-bearish" />}
              <span className="text-xs text-muted-foreground">Total P&L</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Sharpe Ratio</span>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getRatingColor(metrics.sharpeRatio, "sharpe")}`}>
                {metrics.sharpeRatio}
              </p>
              <Badge variant={getRatingBadge(metrics.sharpeRatio, "sharpe").variant} className="text-xs">
                {getRatingBadge(metrics.sharpeRatio, "sharpe").label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Sortino Ratio</span>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${getRatingColor(metrics.sortinoRatio, "sortino")}`}>
                {metrics.sortinoRatio}
              </p>
              <Badge variant={getRatingBadge(metrics.sortinoRatio, "sortino").variant} className="text-xs">
                {getRatingBadge(metrics.sortinoRatio, "sortino").label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-bearish" />
              <span className="text-xs text-muted-foreground">Max Drawdown</span>
            </div>
            <p className={`text-2xl font-bold ${getRatingColor(metrics.maxDrawdown, "drawdown")}`}>
              -{metrics.maxDrawdown}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Win Rate</span>
            </div>
            <p className={`text-2xl font-bold ${getRatingColor(metrics.winRate, "winrate")}`}>
              {metrics.winRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === tf
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-accent text-muted-foreground"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">P&L Chart</TabsTrigger>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown Analysis</TabsTrigger>
          <TabsTrigger value="returns">Daily Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Profit & Loss Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData.data}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    stroke="hsl(var(--primary))"
                    fill="url(#pnlGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} domain={['dataMin - 1000', 'dataMax + 1000']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drawdown">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-bearish" />
                Drawdown Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={historicalData.data}>
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                  />
                  <ReferenceLine y={-metrics.maxDrawdown} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Max: -${metrics.maxDrawdown}%`, fill: 'hsl(var(--destructive))', fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="hsl(var(--destructive))"
                    fill="url(#drawdownGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Daily Returns Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={historicalData.data.slice(-30).map((d, i, arr) => ({
                  date: d.date,
                  return: i > 0 ? ((d.value - arr[i-1].value) / arr[i-1].value) * 100 : 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Bar
                    dataKey="return"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground mb-1">Annualized Return</h4>
            <p className={`text-xl font-bold ${metrics.annualizedReturn >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {metrics.annualizedReturn >= 0 ? '+' : ''}{metrics.annualizedReturn}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground mb-1">Calmar Ratio</h4>
            <p className="text-xl font-bold">{metrics.calmarRatio}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground mb-1">Profit Factor</h4>
            <p className={`text-xl font-bold ${metrics.profitFactor >= 1 ? 'text-bullish' : 'text-bearish'}`}>
              {metrics.profitFactor}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm text-muted-foreground mb-1">Total Return</h4>
            <p className={`text-xl font-bold ${metrics.totalReturn >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
