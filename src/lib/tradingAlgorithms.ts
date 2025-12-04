// Advanced Trading Algorithms and Technical Analysis with Pattern Recognition

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
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  ema9: number | null;
  bollingerBands: { upper: number; middle: number; lower: number; width: number } | null;
  atr: number | null;
  vwap: number | null;
  stochastic: { k: number; d: number } | null;
  obv: number | null;
  adx: number | null;
  cci: number | null;
  williamsR: number | null;
  mfi: number | null;
}

export interface PatternResult {
  name: string;
  type: "bullish" | "bearish" | "neutral";
  strength: number;
  description: string;
}

export interface TradingSignal {
  signal: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasons: string[];
  targetPrice: number;
  stopLoss: number;
  riskReward: number;
  indicators: TechnicalIndicators;
  patterns: PatternResult[];
  trendStrength: number;
  volatility: number;
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

// Calculate RSI with smoothing
export const calculateRSI = (prices: number[], period: number = 14): number | null => {
  if (prices.length < period + 1) return null;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // First average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // Smoothed average
  for (let i = period; i < changes.length; i++) {
    if (changes[i] > 0) {
      avgGain = (avgGain * (period - 1) + changes[i]) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Calculate MACD with improved signal
export const calculateMACD = (prices: number[]): { value: number; signal: number; histogram: number } | null => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (ema12 === null || ema26 === null) return null;
  
  const macdValue = ema12 - ema26;
  
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

// Calculate Bollinger Bands with width
export const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number; width: number } | null => {
  if (prices.length < period) return null;
  
  const slice = prices.slice(-period);
  const middle = slice.reduce((sum, p) => sum + p, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;
  const width = (upper - lower) / middle * 100;
  
  return { upper, middle, lower, width };
};

// Calculate ATR
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

// Calculate VWAP
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
  
  if (high === low) return { k: 50, d: 50 };
  const k = ((close - low) / (high - low)) * 100;
  
  const kValues: number[] = [];
  for (let i = period; i <= data.length; i++) {
    const slice = data.slice(i - period, i);
    const h = Math.max(...slice.map(d => d.high));
    const l = Math.min(...slice.map(d => d.low));
    const c = slice[slice.length - 1].close;
    if (h !== l) kValues.push(((c - l) / (h - l)) * 100);
  }
  
  const d = kValues.length >= 3 ? kValues.slice(-3).reduce((sum, v) => sum + v, 0) / 3 : k;
  
  return { k, d };
};

// Calculate OBV
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

// Calculate ADX (Average Directional Index)
export const calculateADX = (data: PriceData[], period: number = 14): number | null => {
  if (data.length < period * 2) return null;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const highDiff = data[i].high - data[i - 1].high;
    const lowDiff = data[i - 1].low - data[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
    tr.push(Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    ));
  }

  const smoothedTR = calculateEMA(tr, period) || 1;
  const smoothedPlusDM = calculateEMA(plusDM, period) || 0;
  const smoothedMinusDM = calculateEMA(minusDM, period) || 0;

  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;

  const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI || 1) * 100;
  return dx;
};

// Calculate CCI (Commodity Channel Index)
export const calculateCCI = (data: PriceData[], period: number = 20): number | null => {
  if (data.length < period) return null;

  const typicalPrices = data.map(d => (d.high + d.low + d.close) / 3);
  const recentTP = typicalPrices.slice(-period);
  const sma = recentTP.reduce((sum, p) => sum + p, 0) / period;
  const meanDeviation = recentTP.reduce((sum, p) => sum + Math.abs(p - sma), 0) / period;

  if (meanDeviation === 0) return 0;
  return (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);
};

// Calculate Williams %R
export const calculateWilliamsR = (data: PriceData[], period: number = 14): number | null => {
  if (data.length < period) return null;

  const recent = data.slice(-period);
  const highestHigh = Math.max(...recent.map(d => d.high));
  const lowestLow = Math.min(...recent.map(d => d.low));
  const close = data[data.length - 1].close;

  if (highestHigh === lowestLow) return -50;
  return ((highestHigh - close) / (highestHigh - lowestLow)) * -100;
};

// Calculate MFI (Money Flow Index)
export const calculateMFI = (data: PriceData[], period: number = 14): number | null => {
  if (data.length < period + 1) return null;

  let positiveFlow = 0;
  let negativeFlow = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const prevTypicalPrice = (data[i - 1].high + data[i - 1].low + data[i - 1].close) / 3;
    const rawMoneyFlow = typicalPrice * data[i].volume;

    if (typicalPrice > prevTypicalPrice) {
      positiveFlow += rawMoneyFlow;
    } else {
      negativeFlow += rawMoneyFlow;
    }
  }

  if (negativeFlow === 0) return 100;
  const moneyFlowRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyFlowRatio));
};

// Detect candlestick patterns
export const detectPatterns = (data: PriceData[]): PatternResult[] => {
  const patterns: PatternResult[] = [];
  if (data.length < 5) return patterns;

  const recent = data.slice(-5);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];
  const bodySize = Math.abs(last.close - last.open);
  const upperWick = last.high - Math.max(last.close, last.open);
  const lowerWick = Math.min(last.close, last.open) - last.low;
  const range = last.high - last.low;

  // Doji
  if (bodySize < range * 0.1) {
    patterns.push({
      name: "Doji",
      type: "neutral",
      strength: 70,
      description: "Indecision in the market, potential reversal"
    });
  }

  // Hammer (bullish)
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && last.close > last.open) {
    patterns.push({
      name: "Hammer",
      type: "bullish",
      strength: 75,
      description: "Bullish reversal pattern after downtrend"
    });
  }

  // Shooting Star (bearish)
  if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && last.close < last.open) {
    patterns.push({
      name: "Shooting Star",
      type: "bearish",
      strength: 75,
      description: "Bearish reversal pattern after uptrend"
    });
  }

  // Engulfing patterns
  if (last.close > last.open && prev.close < prev.open &&
      last.close > prev.open && last.open < prev.close) {
    patterns.push({
      name: "Bullish Engulfing",
      type: "bullish",
      strength: 80,
      description: "Strong bullish reversal signal"
    });
  }

  if (last.close < last.open && prev.close > prev.open &&
      last.open > prev.close && last.close < prev.open) {
    patterns.push({
      name: "Bearish Engulfing",
      type: "bearish",
      strength: 80,
      description: "Strong bearish reversal signal"
    });
  }

  // Morning Star (3 candle bullish pattern)
  if (recent.length >= 3) {
    const first = recent[recent.length - 3];
    const second = recent[recent.length - 2];
    const third = recent[recent.length - 1];
    
    if (first.close < first.open && // bearish first
        Math.abs(second.close - second.open) < (first.high - first.low) * 0.3 && // small body
        third.close > third.open && // bullish third
        third.close > (first.open + first.close) / 2) {
      patterns.push({
        name: "Morning Star",
        type: "bullish",
        strength: 85,
        description: "Strong bullish reversal pattern"
      });
    }
  }

  return patterns;
};

// Calculate trend strength
export const calculateTrendStrength = (data: PriceData[]): number => {
  if (data.length < 20) return 50;

  const closes = data.map(d => d.close);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, Math.min(50, closes.length));
  const currentPrice = closes[closes.length - 1];

  if (!sma20 || !sma50) return 50;

  let strength = 50;

  // Price above/below moving averages
  if (currentPrice > sma20) strength += 15;
  else strength -= 15;

  if (currentPrice > sma50) strength += 10;
  else strength -= 10;

  // MA alignment
  if (sma20 > sma50) strength += 10;
  else strength -= 10;

  // Recent momentum
  const recentChange = (currentPrice - closes[Math.max(0, closes.length - 10)]) / closes[Math.max(0, closes.length - 10)] * 100;
  strength += Math.min(15, Math.max(-15, recentChange * 3));

  return Math.min(100, Math.max(0, strength));
};

// Calculate volatility
export const calculateVolatility = (data: PriceData[]): number => {
  if (data.length < 14) return 50;

  const atr = calculateATR(data, 14);
  const currentPrice = data[data.length - 1].close;

  if (!atr || currentPrice === 0) return 50;

  const atrPercent = (atr / currentPrice) * 100;

  // Normalize to 0-100 scale (2% ATR = 50, higher = more volatile)
  return Math.min(100, Math.max(0, atrPercent * 25));
};

// Generate all technical indicators
export const calculateAllIndicators = (data: PriceData[]): TechnicalIndicators => {
  const closePrices = data.map(d => d.close);
  
  return {
    rsi: calculateRSI(closePrices),
    macd: calculateMACD(closePrices),
    sma20: calculateSMA(closePrices, 20),
    sma50: calculateSMA(closePrices, 50),
    sma200: calculateSMA(closePrices, Math.min(200, closePrices.length)),
    ema12: calculateEMA(closePrices, 12),
    ema26: calculateEMA(closePrices, 26),
    ema9: calculateEMA(closePrices, 9),
    bollingerBands: calculateBollingerBands(closePrices),
    atr: calculateATR(data),
    vwap: calculateVWAP(data),
    stochastic: calculateStochastic(data),
    obv: calculateOBV(data),
    adx: calculateADX(data),
    cci: calculateCCI(data),
    williamsR: calculateWilliamsR(data),
    mfi: calculateMFI(data),
  };
};

// Enhanced Trading Signal Generation
export const generateTradingSignal = (data: PriceData[]): TradingSignal => {
  const indicators = calculateAllIndicators(data);
  const patterns = detectPatterns(data);
  const currentPrice = data[data.length - 1].close;
  const reasons: string[] = [];
  let bullishScore = 0;
  let bearishScore = 0;

  // RSI Analysis (weight: 15)
  if (indicators.rsi !== null) {
    if (indicators.rsi < 25) {
      bullishScore += 15;
      reasons.push(`RSI extremely oversold (${indicators.rsi.toFixed(1)})`);
    } else if (indicators.rsi < 35) {
      bullishScore += 10;
      reasons.push(`RSI oversold (${indicators.rsi.toFixed(1)})`);
    } else if (indicators.rsi > 75) {
      bearishScore += 15;
      reasons.push(`RSI extremely overbought (${indicators.rsi.toFixed(1)})`);
    } else if (indicators.rsi > 65) {
      bearishScore += 10;
      reasons.push(`RSI overbought (${indicators.rsi.toFixed(1)})`);
    } else if (indicators.rsi > 50) {
      bullishScore += 3;
    } else {
      bearishScore += 3;
    }
  }

  // MACD Analysis (weight: 15)
  if (indicators.macd !== null) {
    if (indicators.macd.histogram > 0) {
      bullishScore += 8;
      if (indicators.macd.value > indicators.macd.signal) {
        bullishScore += 7;
        reasons.push("MACD bullish crossover confirmed");
      }
    } else {
      bearishScore += 8;
      if (indicators.macd.value < indicators.macd.signal) {
        bearishScore += 7;
        reasons.push("MACD bearish crossover confirmed");
      }
    }
  }

  // Moving Average Analysis (weight: 20)
  if (indicators.sma20 !== null && indicators.sma50 !== null) {
    if (indicators.sma20 > indicators.sma50) {
      bullishScore += 10;
      if (currentPrice > indicators.sma20) {
        bullishScore += 10;
        reasons.push("Golden cross with price above SMA20");
      }
    } else {
      bearishScore += 10;
      if (currentPrice < indicators.sma20) {
        bearishScore += 10;
        reasons.push("Death cross with price below SMA20");
      }
    }
  }

  // Bollinger Bands Analysis (weight: 12)
  if (indicators.bollingerBands !== null) {
    const bb = indicators.bollingerBands;
    const percentB = (currentPrice - bb.lower) / (bb.upper - bb.lower);
    
    if (percentB < 0.1) {
      bullishScore += 12;
      reasons.push("Price at lower Bollinger Band (reversal zone)");
    } else if (percentB > 0.9) {
      bearishScore += 12;
      reasons.push("Price at upper Bollinger Band (reversal zone)");
    } else if (percentB < 0.3) {
      bullishScore += 6;
    } else if (percentB > 0.7) {
      bearishScore += 6;
    }
  }

  // Stochastic Analysis (weight: 10)
  if (indicators.stochastic !== null) {
    if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
      bullishScore += 10;
      reasons.push("Stochastic in oversold territory");
    } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
      bearishScore += 10;
      reasons.push("Stochastic in overbought territory");
    }
    // Crossovers
    if (indicators.stochastic.k > indicators.stochastic.d && indicators.stochastic.k < 30) {
      bullishScore += 5;
    } else if (indicators.stochastic.k < indicators.stochastic.d && indicators.stochastic.k > 70) {
      bearishScore += 5;
    }
  }

  // ADX/CCI/Williams Analysis (weight: 8 each)
  if (indicators.adx !== null && indicators.adx > 25) {
    // Strong trend - add to dominant direction
    if (bullishScore > bearishScore) bullishScore += 8;
    else bearishScore += 8;
    reasons.push(`Strong trend (ADX: ${indicators.adx.toFixed(1)})`);
  }

  if (indicators.cci !== null) {
    if (indicators.cci < -100) bullishScore += 8;
    else if (indicators.cci > 100) bearishScore += 8;
  }

  if (indicators.williamsR !== null) {
    if (indicators.williamsR < -80) bullishScore += 5;
    else if (indicators.williamsR > -20) bearishScore += 5;
  }

  // MFI Analysis (weight: 8)
  if (indicators.mfi !== null) {
    if (indicators.mfi < 20) {
      bullishScore += 8;
      reasons.push("Money Flow Index shows oversold condition");
    } else if (indicators.mfi > 80) {
      bearishScore += 8;
      reasons.push("Money Flow Index shows overbought condition");
    }
  }

  // Pattern Analysis (weight: up to 15)
  patterns.forEach(pattern => {
    const patternWeight = Math.round(pattern.strength / 100 * 15);
    if (pattern.type === "bullish") {
      bullishScore += patternWeight;
      reasons.push(`${pattern.name}: ${pattern.description}`);
    } else if (pattern.type === "bearish") {
      bearishScore += patternWeight;
      reasons.push(`${pattern.name}: ${pattern.description}`);
    }
  });

  // Calculate final signal
  const totalScore = bullishScore + bearishScore;
  const netScore = bullishScore - bearishScore;
  
  let signal: "BUY" | "SELL" | "HOLD";
  if (netScore > 20) {
    signal = "BUY";
  } else if (netScore < -20) {
    signal = "SELL";
  } else {
    signal = "HOLD";
  }

  // Calculate confidence
  const confidence = totalScore > 0 
    ? Math.min(95, Math.max(35, 50 + Math.abs(netScore)))
    : 50;

  // Calculate target and stop loss based on ATR and volatility
  const atr = indicators.atr || currentPrice * 0.02;
  const volatility = calculateVolatility(data);
  const atrMultiplier = volatility > 60 ? 2.5 : volatility > 40 ? 2 : 1.5;

  const targetPrice = signal === "BUY" 
    ? currentPrice + atr * atrMultiplier * 1.5
    : signal === "SELL" 
      ? currentPrice - atr * atrMultiplier * 1.5
      : currentPrice;
  
  const stopLoss = signal === "BUY"
    ? currentPrice - atr * atrMultiplier
    : signal === "SELL"
      ? currentPrice + atr * atrMultiplier
      : currentPrice;

  const riskReward = Math.abs(targetPrice - currentPrice) / Math.abs(currentPrice - stopLoss);
  const trendStrength = calculateTrendStrength(data);

  if (reasons.length === 0) {
    reasons.push("Mixed signals - waiting for clearer market direction");
  }

  return {
    signal,
    confidence,
    reasons,
    targetPrice,
    stopLoss,
    riskReward,
    indicators,
    patterns,
    trendStrength,
    volatility,
  };
};