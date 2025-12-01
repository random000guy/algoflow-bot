import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { BarChart2, TrendingUp } from "lucide-react";

interface HistoricalChartProps {
  symbol: string;
}

interface PriceData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate mock intraday data for demonstration
const generateIntradayData = (basePrice: number): PriceData[] => {
  const data: PriceData[] = [];
  const now = new Date();
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 30, 0, 0);
  
  let currentPrice = basePrice;
  
  for (let i = 0; i < 78; i++) { // 6.5 hours * 12 (5-min intervals)
    const time = new Date(marketOpen.getTime() + i * 5 * 60000);
    const volatility = basePrice * 0.002;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000) + 100000,
    });
    
    currentPrice = close;
  }
  
  return data;
};

export const HistoricalChart = ({ symbol }: HistoricalChartProps) => {
  const [chartType, setChartType] = useState<"line" | "candlestick">("line");
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch actual historical data
    // For now, generate mock data based on a typical stock price
    setLoading(true);
    setTimeout(() => {
      const basePrice = 187.35; // Mock base price
      setData(generateIntradayData(basePrice));
      setLoading(false);
    }, 500);
  }, [symbol]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      </Card>
    );
  }

  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));
  const priceChange = data[data.length - 1].close - data[0].open;
  const priceChangePercent = (priceChange / data[0].open) * 100;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Intraday Chart - {symbol}</h3>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold font-mono">
              ${data[data.length - 1].close.toFixed(2)}
            </span>
            <span className={`text-sm font-semibold flex items-center gap-1 ${priceChange >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              <TrendingUp className={`h-4 w-4 ${priceChange < 0 ? 'rotate-180' : ''}`} />
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as "line" | "candlestick")}>
          <TabsList>
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              interval={Math.floor(data.length / 8)}
            />
            <YAxis 
              domain={[minPrice * 0.999, maxPrice * 1.001]}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              interval={Math.floor(data.length / 8)}
            />
            <YAxis 
              domain={[minPrice * 0.999, maxPrice * 1.001]}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]}
            />
            <Area 
              type="monotone" 
              dataKey="high" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))" 
              fillOpacity={0.1}
              strokeWidth={1}
            />
            <Area 
              type="monotone" 
              dataKey="low" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--background))" 
              fillOpacity={0.3}
              strokeWidth={1}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Open</div>
          <div className="font-semibold font-mono">${data[0].open.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">High</div>
          <div className="font-semibold font-mono text-bullish">${maxPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Low</div>
          <div className="font-semibold font-mono text-bearish">${minPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Volume</div>
          <div className="font-semibold font-mono">
            {(data.reduce((sum, d) => sum + d.volume, 0) / 1000000).toFixed(2)}M
          </div>
        </div>
      </div>
    </Card>
  );
};
