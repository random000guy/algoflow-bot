import { useState, useEffect, useCallback, useRef } from "react";

interface RealtimeQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  bid?: number;
  ask?: number;
}

interface UseRealtimeMarketDataOptions {
  symbols: string[];
  enabled?: boolean;
}

// Simulated real-time streaming with realistic price movements
export const useRealtimeMarketData = ({ symbols, enabled = true }: UseRealtimeMarketDataOptions) => {
  const [quotes, setQuotes] = useState<Map<string, RealtimeQuote>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const basePricesRef = useRef<Map<string, number>>(new Map());

  // Initialize base prices
  useEffect(() => {
    const basePrices: Record<string, number> = {
      AAPL: 187.35,
      MSFT: 378.42,
      GOOGL: 139.25,
      AMZN: 178.50,
      NVDA: 492.75,
      META: 334.20,
      TSLA: 248.90,
      AMD: 145.30,
      INTC: 44.85,
      IBM: 163.20,
      V: 275.40,
      WMT: 156.80,
      KO: 58.45,
      PEP: 173.60,
      BA: 234.50,
      BAC: 33.20,
      PLTR: 22.15,
      GM: 38.90,
    };

    symbols.forEach(symbol => {
      if (!basePricesRef.current.has(symbol)) {
        basePricesRef.current.set(symbol, basePrices[symbol] || 100 + Math.random() * 200);
      }
    });
  }, [symbols]);

  // Generate realistic price tick
  const generateTick = useCallback((symbol: string): RealtimeQuote => {
    const currentQuote = quotes.get(symbol);
    const basePrice = basePricesRef.current.get(symbol) || 100;
    
    // Use previous price or base price
    const prevPrice = currentQuote?.price || basePrice;
    
    // Random walk with mean reversion
    const volatility = 0.0003; // ~3 basis points per tick
    const meanReversion = 0.001;
    const drift = (basePrice - prevPrice) * meanReversion;
    const randomMove = (Math.random() - 0.5) * 2 * volatility * prevPrice;
    
    const newPrice = prevPrice + drift + randomMove;
    const change = newPrice - basePrice;
    const changePercent = (change / basePrice) * 100;
    
    // Simulated bid/ask spread
    const spread = newPrice * 0.0001; // 1 basis point spread
    
    return {
      symbol,
      price: Math.max(0.01, newPrice),
      change,
      changePercent,
      volume: Math.floor(Math.random() * 10000) + 100,
      timestamp: new Date(),
      bid: newPrice - spread / 2,
      ask: newPrice + spread / 2,
    };
  }, [quotes]);

  // Start streaming simulation
  const connect = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsConnected(true);
    setError(null);
    
    // Initial quotes
    const initialQuotes = new Map<string, RealtimeQuote>();
    symbols.forEach(symbol => {
      const basePrice = basePricesRef.current.get(symbol) || 100;
      initialQuotes.set(symbol, {
        symbol,
        price: basePrice,
        change: 0,
        changePercent: 0,
        volume: 0,
        timestamp: new Date(),
      });
    });
    setQuotes(initialQuotes);
    
    // Stream updates at ~100ms intervals for realistic feel
    intervalRef.current = setInterval(() => {
      setQuotes(prev => {
        const updated = new Map(prev);
        // Update 1-3 random symbols per tick
        const numUpdates = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...symbols].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(numUpdates, shuffled.length); i++) {
          const symbol = shuffled[i];
          const tick = generateTick(symbol);
          updated.set(symbol, tick);
        }
        
        return updated;
      });
    }, 100);
  }, [symbols, generateTick]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && symbols.length > 0) {
      connect();
    } else {
      disconnect();
    }
    
    return () => disconnect();
  }, [enabled, symbols.length, connect, disconnect]);

  return {
    quotes,
    isConnected,
    error,
    connect,
    disconnect,
  };
};
