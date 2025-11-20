import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

interface ChartData {
  date: string;
  price: number;
  volume: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  upperBand?: number;
  lowerBand?: number;
  sma?: number;
}

// Mock data generator with technical indicators
const generateMockData = (): ChartData[] => {
  const data: ChartData[] = [];
  let price = 150;
  const days = 60;

  // Generate price data
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 5;
    price = Math.max(100, price + change);
    
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 500000,
    });
  }

  // Calculate RSI (14-period)
  const rsiPeriod = 14;
  for (let i = rsiPeriod; i < data.length; i++) {
    let gains = 0;
    let losses = 0;
    
    for (let j = i - rsiPeriod; j < i; j++) {
      const change = data[j + 1].price - data[j].price;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    const rs = avgGain / avgLoss;
    data[i].rsi = parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  }

  // Calculate MACD
  const calculateEMA = (period: number) => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    ema[0] = data[0].price;
    
    for (let i = 1; i < data.length; i++) {
      ema[i] = (data[i].price - ema[i - 1]) * multiplier + ema[i - 1];
    }
    return ema;
  };

  const ema12 = calculateEMA(12);
  const ema26 = calculateEMA(26);
  
  for (let i = 26; i < data.length; i++) {
    data[i].macd = parseFloat((ema12[i] - ema26[i]).toFixed(2));
  }

  // Calculate MACD Signal line (9-period EMA of MACD)
  const macdValues = data.filter(d => d.macd !== undefined).map(d => d.macd!);
  const signalMultiplier = 2 / (9 + 1);
  let signal = macdValues[0];
  
  let macdIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].macd !== undefined) {
      signal = (macdValues[macdIndex] - signal) * signalMultiplier + signal;
      data[i].signal = parseFloat(signal.toFixed(2));
      macdIndex++;
    }
  }

  // Calculate Bollinger Bands (20-period SMA with 2 std dev)
  const bbPeriod = 20;
  for (let i = bbPeriod; i < data.length; i++) {
    const slice = data.slice(i - bbPeriod, i);
    const sma = slice.reduce((sum, d) => sum + d.price, 0) / bbPeriod;
    const variance = slice.reduce((sum, d) => sum + Math.pow(d.price - sma, 2), 0) / bbPeriod;
    const stdDev = Math.sqrt(variance);
    
    data[i].sma = parseFloat(sma.toFixed(2));
    data[i].upperBand = parseFloat((sma + 2 * stdDev).toFixed(2));
    data[i].lowerBand = parseFloat((sma - 2 * stdDev).toFixed(2));
  }

  return data;
};

interface AdvancedChartProps {
  symbol?: string;
}

export const AdvancedChart = ({ symbol = "AAPL" }: AdvancedChartProps) => {
  const [data] = useState<ChartData[]>(generateMockData());
  const [activeIndicator, setActiveIndicator] = useState<"rsi" | "macd" | "bollinger">("rsi");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Advanced Chart - {symbol}</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeIndicator === "rsi" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveIndicator("rsi")}
            >
              RSI
            </Button>
            <Button
              variant={activeIndicator === "macd" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveIndicator("macd")}
            >
              MACD
            </Button>
            <Button
              variant={activeIndicator === "bollinger" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveIndicator("bollinger")}
            >
              Bollinger Bands
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Price Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Price Action</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
                {activeIndicator === "bollinger" && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="sma"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={1}
                      dot={false}
                      name="SMA"
                    />
                    <Line
                      type="monotone"
                      dataKey="upperBand"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Upper Band"
                    />
                    <Line
                      type="monotone"
                      dataKey="lowerBand"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Lower Band"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div>
            <h4 className="text-sm font-medium mb-4">Volume</h4>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="volume" fill="hsl(var(--chart-4))" name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Indicator Chart */}
          {activeIndicator === "rsi" && (
            <div>
              <h4 className="text-sm font-medium mb-4">RSI (Relative Strength Index)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={70} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Overbought" />
                  <ReferenceLine y={30} stroke="hsl(var(--chart-1))" strokeDasharray="3 3" label="Oversold" />
                  <Line
                    type="monotone"
                    dataKey="rsi"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="RSI"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeIndicator === "macd" && (
            <div>
              <h4 className="text-sm font-medium mb-4">MACD (Moving Average Convergence Divergence)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Line
                    type="monotone"
                    dataKey="macd"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="MACD"
                  />
                  <Line
                    type="monotone"
                    dataKey="signal"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    dot={false}
                    name="Signal"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
