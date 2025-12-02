// Advanced Trading Algorithms and Technical Analysis

export interface PriceData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  atr: number | null;
  vwap: number | null;
  stochastic: { k: number; d: number } | null;
  obv: number | null;
}

export interface TradingSignal {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasons: string[];
  targetPrice: number;
  stopLoss: number;
  riskReward: number;
  indicators: TechnicalIndicators;
}

// Calculate Simple Moving Average
export const calculateSMA = (prices: number[], period: number): number | null => {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
};

// Calculate Exponential Moving Average
export const calculateEMA = (prices: number[], period: number): number | null => {
  if (prices.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
};

// Calculate RSI (Relative Strength Index)
export const calculateRSI = (prices: number[], period: number = 14): number | null => {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Calculate MACD
export const calculateMACD = (prices: number[]): { value: number; signal: number; histogram: number } | null => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (ema12 === null || ema26 === null) return null;
  
  const macdValue = ema12 - ema26;
  
  // Calculate signal line (9-period EMA of MACD)
  const macdHistory: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i + 1), 12);
    const e26 = calculateEMA(prices.slice(0, i + 1), 26);
    if (e12 && e26) macdHistory.push(e12 - e26);
  }
  
  const signal = calculateEMA(macdHistory, 9) || macdValue;
  
  return {
    value: macdValue,
    signal,
    histogram: macdValue - signal,
  };
};

// Calculate Bollinger Bands
export const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } | null => {
  if (prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const middle = slice.reduce((sum, p) => sum + p, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: middle + stdDev * std,
    middle,
    lower: middle - stdDev * std,
  };
};

// Calculate ATR (Average True Range)
export const calculateATR = (data: PriceData[], period: number = 14): number | null => {
  if (data.length < period + 1) return null;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const tr = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
    trueRanges.push(tr);
  }
  
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((sum, tr) => sum + tr, 0) / period;
};

// Calculate VWAP (Volume Weighted Average Price)
export const calculateVWAP = (data: PriceData[]): number | null => {
  if (data.length === 0) return null;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const bar of data) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
};

// Calculate Stochastic Oscillator
export const calculateStochastic = (data: PriceData[], period: number = 14): { k: number; d: number } | null => {
  if (data.length < period) return null;
  
  const recent = data.slice(-period);
  const high = Math.max(...recent.map(d => d.high));
  const low = Math.min(...recent.map(d => d.low));
  const close = data[data.length - 1].close;
  
  const k = ((close - low) / (high - low)) * 100;
  
  // Calculate %D (3-period SMA of %K)
  const kValues: number[] = [];
  for (let i = period; i <= data.length; i++) {
    const slice = data.slice(i - period, i);
    const h = Math.max(...slice.map(d => d.high));
    const l = Math.min(...slice.map(d => d.low));
    const c = slice[slice.length - 1].close;
    kValues.push(((c - l) / (h - l)) * 100);
  }
  
  const d = kValues.slice(-3).reduce((sum, v) => sum + v, 0) / 3;
  
  return { k, d };
};

// Calculate OBV (On-Balance Volume)
export const calculateOBV = (data: PriceData[]): number => {
  let obv = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }
  }
  return obv;
};

// Generate all technical indicators
export const calculateAllIndicators = (data: PriceData[]): TechnicalIndicators => {
  const closePrices = data.map(d => d.close);
  
  return {
    rsi: calculateRSI(closePrices),
    macd: calculateMACD(closePrices),
    sma20: calculateSMA(closePrices, 20),
    sma50: calculateSMA(closePrices, 50),
    ema12: calculateEMA(closePrices, 12),
    ema26: calculateEMA(closePrices, 26),
    bollingerBands: calculateBollingerBands(closePrices),
    atr: calculateATR(data),
    vwap: calculateVWAP(data),
    stochastic: calculateStochastic(data),
    obv: calculateOBV(data),
  };
};

// Generate Trading Signal based on multiple indicators
export const generateTradingSignal = (data: PriceData[]): TradingSignal => {
  const indicators = calculateAllIndicators(data);
  const currentPrice = data[data.length - 1].close;
  const reasons: string[] = [];
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // RSI Analysis
  if (indicators.rsi !== null) {
    if (indicators.rsi < 30) {
      bullishSignals += 2;
      reasons.push(`RSI oversold at ${indicators.rsi.toFixed(1)}`);
    } else if (indicators.rsi > 70) {
      bearishSignals += 2;
      reasons.push(`RSI overbought at ${indicators.rsi.toFixed(1)}`);
    } else if (indicators.rsi < 45) {
      bullishSignals += 1;
    } else if (indicators.rsi > 55) {
      bearishSignals += 1;
    }
  }
  
  // MACD Analysis
  if (indicators.macd !== null) {
    if (indicators.macd.histogram > 0 && indicators.macd.value > indicators.macd.signal) {
      bullishSignals += 2;
      reasons.push("MACD bullish crossover");
    } else if (indicators.macd.histogram < 0 && indicators.macd.value < indicators.macd.signal) {
      bearishSignals += 2;
      reasons.push("MACD bearish crossover");
    }
  }
  
  // Moving Average Analysis
  if (indicators.sma20 !== null && indicators.sma50 !== null) {
    if (indicators.sma20 > indicators.sma50) {
      bullishSignals += 1;
      if (currentPrice > indicators.sma20) {
        bullishSignals += 1;
        reasons.push("Price above SMA20, golden cross active");
      }
    } else {
      bearishSignals += 1;
      if (currentPrice < indicators.sma20) {
        bearishSignals += 1;
        reasons.push("Price below SMA20, death cross active");
      }
    }
  }
  
  // Bollinger Bands Analysis
  if (indicators.bollingerBands !== null) {
    const bb = indicators.bollingerBands;
    if (currentPrice <= bb.lower) {
      bullishSignals += 2;
      reasons.push("Price at lower Bollinger Band (potential reversal)");
    } else if (currentPrice >= bb.upper) {
      bearishSignals += 2;
      reasons.push("Price at upper Bollinger Band (potential reversal)");
    }
  }
  
  // Stochastic Analysis
  if (indicators.stochastic !== null) {
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
      bullishSignals += 1;
      reasons.push("Stochastic oversold");
    } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
      bearishSignals += 1;
      reasons.push("Stochastic overbought");
    }
  }
  
  // VWAP Analysis
  if (indicators.vwap !== null) {
    if (currentPrice > indicators.vwap) {
      bullishSignals += 1;
    } else {
      bearishSignals += 1;
    }
  }
  
  // Determine signal
  const totalSignals = bullishSignals + bearishSignals;
  const confidence = totalSignals > 0 
    ? Math.round((Math.abs(bullishSignals - bearishSignals) / totalSignals) * 100)
    : 50;
  
  let signal: "BUY" | "SELL" | "HOLD";
  if (bullishSignals > bearishSignals + 2) {
    signal = "BUY";
  } else if (bearishSignals > bullishSignals + 2) {
    signal = "SELL";
  } else {
    signal = "HOLD";
  }
  
  // Calculate target and stop loss based on ATR
  const atr = indicators.atr || currentPrice * 0.02;
  const targetPrice = signal === "BUY" 
    ? currentPrice + atr * 2 
    : signal === "SELL" 
      ? currentPrice - atr * 2 
      : currentPrice;
  
  const stopLoss = signal === "BUY"
    ? currentPrice - atr * 1.5
    : signal === "SELL"
      ? currentPrice + atr * 1.5
      : currentPrice;
  
  const riskReward = Math.abs(targetPrice - currentPrice) / Math.abs(currentPrice - stopLoss);
  
  if (reasons.length === 0) {
    reasons.push("Neutral market conditions, waiting for clearer signals");
  }
  
  return {
    signal,
    confidence: Math.min(95, Math.max(30, confidence + 40)),
    reasons,
    targetPrice,
    stopLoss,
    riskReward,
    indicators,
  };
};
