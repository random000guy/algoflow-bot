import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, ReferenceLine, Brush
} from "recharts";
import { 
  BarChart2, TrendingUp, TrendingDown, Crosshair, 
  ZoomIn, ZoomOut, RefreshCw, Maximize2
} from "lucide-react";
import { calculateSMA, calculateEMA, calculateBollingerBands } from "@/lib/tradingAlgorithms";

interface EnhancedChartProps {
  symbol: string;
}

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  ema12?: number;
  upperBB?: number;
  lowerBB?: number;
  vwap?: number;
  bullish?: boolean;
}

// Generate realistic mock data
const generateMockData = (basePrice: number, days: number = 100): ChartData[] => {
  const data: ChartData[] = [];
  let price = basePrice;
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const volatility = basePrice * 0.02;
    const trend = Math.sin(i / 20) * volatility * 0.3;
    const noise = (Math.random() - 0.5) * volatility;
    const change = trend + noise;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 50000000) + 10000000;
    
    const time = new Date(now);
    time.setDate(time.getDate() - (days - i));
    
    data.push({
      time: time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      bullish: close > open,
    });
    
    price = close;
  }
  
  // Add technical indicators
  const closePrices = data.map(d => d.close);
  
  for (let i = 0; i < data.length; i++) {
    if (i >= 19) {
      data[i].sma20 = calculateSMA(closePrices.slice(0, i + 1), 20) || undefined;
    }
    if (i >= 11) {
      data[i].ema12 = calculateEMA(closePrices.slice(0, i + 1), 12) || undefined;
    }
    if (i >= 19) {
      const bb = calculateBollingerBands(closePrices.slice(0, i + 1), 20, 2);
      if (bb) {
        data[i].upperBB = bb.upper;
        data[i].lowerBB = bb.lower;
      }
    }
    
    // Calculate VWAP
    let tpv = 0;
    let vol = 0;
    for (let j = 0; j <= i; j++) {
      const tp = (data[j].high + data[j].low + data[j].close) / 3;
      tpv += tp * data[j].volume;
      vol += data[j].volume;
    }
    data[i].vwap = parseFloat((tpv / vol).toFixed(2));
  }
  
  return data;
};

// Custom candlestick component
const CandlestickBar = (props: any) => {
  const { x, y, width, height, fill, payload } = props;
  if (!payload) return null;
  
  const { open, close, high, low, bullish } = payload;
  const color = bullish ? "hsl(var(--bullish))" : "hsl(var(--bearish))";
  const minY = Math.min(open, close);
  const maxY = Math.max(open, close);
  
  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.2}
        y={y + (height * (high - maxY)) / (high - low)}
        width={width * 0.6}
        height={Math.max(1, (height * Math.abs(close - open)) / (high - low))}
        fill={bullish ? color : color}
        stroke={color}
      />
    </g>
  );
};

export const EnhancedChart = ({ symbol }: EnhancedChartProps) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    ema12: false,
    bb: false,
    vwap: false,
  });
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M">("1M");

  useEffect(() => {
    setLoading(true);
    const daysMap = { "1D": 24, "1W": 35, "1M": 60, "3M": 90 };
    setTimeout(() => {
      setData(generateMockData(187.35, daysMap[timeframe]));
      setLoading(false);
    }, 300);
  }, [symbol, timeframe]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const latest = data[data.length - 1];
    const first = data[0];
    const change = latest.close - first.open;
    const changePercent = (change / first.open) * 100;
    const high = Math.max(...data.map(d => d.high));
    const low = Math.min(...data.map(d => d.low));
    const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;
    
    return { latest, change, changePercent, high, low, avgVolume };
  }, [data]);

  if (loading || !stats) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[500px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold mb-2">{label}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-mono">${data.open?.toFixed(2)}</span>
          <span className="text-muted-foreground">High:</span>
          <span className="font-mono text-bullish">${data.high?.toFixed(2)}</span>
          <span className="text-muted-foreground">Low:</span>
          <span className="font-mono text-bearish">${data.low?.toFixed(2)}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className="font-mono font-semibold">${data.close?.toFixed(2)}</span>
          <span className="text-muted-foreground">Volume:</span>
          <span className="font-mono">{(data.volume / 1000000).toFixed(1)}M</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold">{symbol}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold font-mono">
              ${stats.latest.close.toFixed(2)}
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
              stats.change >= 0 ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'
            }`}>
              {stats.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)} ({stats.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe */}
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="1D" className="text-xs px-2">1D</TabsTrigger>
              <TabsTrigger value="1W" className="text-xs px-2">1W</TabsTrigger>
              <TabsTrigger value="1M" className="text-xs px-2">1M</TabsTrigger>
              <TabsTrigger value="3M" className="text-xs px-2">3M</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Chart Type */}
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="candlestick" className="text-xs px-2">Candle</TabsTrigger>
              <TabsTrigger value="line" className="text-xs px-2">Line</TabsTrigger>
              <TabsTrigger value="area" className="text-xs px-2">Area</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Indicator Toggles */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-sm text-muted-foreground">Indicators:</span>
        {Object.entries(showIndicators).map(([key, value]) => (
          <Badge
            key={key}
            variant={value ? "default" : "outline"}
            className="cursor-pointer transition-all"
            onClick={() => setShowIndicators(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
          >
            {key.toUpperCase()}
          </Badge>
        ))}
        <Badge
          variant={showVolume ? "default" : "outline"}
          className="cursor-pointer transition-all"
          onClick={() => setShowVolume(!showVolume)}
        >
          VOL
        </Badge>
      </div>

      {/* Main Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bollinger Bands */}
          {showIndicators.bb && (
            <>
              <Area
                type="monotone"
                dataKey="upperBB"
                stroke="none"
                fill="hsl(var(--primary))"
                fillOpacity={0.05}
              />
              <Area
                type="monotone"
                dataKey="lowerBB"
                stroke="none"
                fill="hsl(var(--background))"
                fillOpacity={1}
              />
              <Line type="monotone" dataKey="upperBB" stroke="hsl(var(--primary))" strokeWidth={1} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="lowerBB" stroke="hsl(var(--primary))" strokeWidth={1} dot={false} strokeDasharray="5 5" />
            </>
          )}

          {/* Price Line/Area */}
          {chartType === "area" && (
            <Area
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          {chartType === "line" && (
            <Line
              type="monotone"
              dataKey="close"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          )}
          {chartType === "candlestick" && (
            <>
              <Bar dataKey="high" fill="transparent" />
              {data.map((entry, index) => {
                const barHeight = entry.high - entry.low;
                const color = entry.bullish ? "hsl(var(--bullish))" : "hsl(var(--bearish))";
                return null; // Simplified - using line for demo
              })}
              <Line
                type="monotone"
                dataKey="close"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={payload.bullish ? "hsl(var(--bullish))" : "hsl(var(--bearish))"}
                    />
                  );
                }}
              />
            </>
          )}

          {/* Moving Averages */}
          {showIndicators.sma20 && (
            <Line type="monotone" dataKey="sma20" stroke="hsl(var(--chart-2, 200 80% 60%))" strokeWidth={1.5} dot={false} name="SMA 20" />
          )}
          {showIndicators.ema12 && (
            <Line type="monotone" dataKey="ema12" stroke="hsl(var(--chart-3, 280 80% 60%))" strokeWidth={1.5} dot={false} name="EMA 12" />
          )}
          {showIndicators.vwap && (
            <Line type="monotone" dataKey="vwap" stroke="hsl(var(--chart-4, 40 80% 50%))" strokeWidth={1.5} dot={false} name="VWAP" strokeDasharray="3 3" />
          )}
          
          <Brush dataKey="time" height={30} stroke="hsl(var(--primary))" fill="hsl(var(--muted))" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Volume Chart */}
      {showVolume && (
        <ResponsiveContainer width="100%" height={100} className="mt-4">
          <ComposedChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="time" hide />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />
            <Bar
              dataKey="volume"
              fill="hsl(var(--primary))"
              opacity={0.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Stats Footer */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Period High</div>
          <div className="font-bold font-mono text-bullish">${stats.high.toFixed(2)}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Period Low</div>
          <div className="font-bold font-mono text-bearish">${stats.low.toFixed(2)}</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Avg Volume</div>
          <div className="font-bold font-mono">{(stats.avgVolume / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="text-muted-foreground text-xs mb-1">Range</div>
          <div className="font-bold font-mono">${(stats.high - stats.low).toFixed(2)}</div>
        </div>
      </div>
    </Card>
  );
};
