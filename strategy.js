(() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const avg = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  function sma(values, period) {
    return values.map((_, index) => {
      if (index < period - 1) return null;
      return avg(values.slice(index - period + 1, index + 1));
    });
  }

  function ema(values, period) {
    const k = 2 / (period + 1);
    const result = [];
    let prev = values[0] || 0;
    values.forEach((value, index) => {
      prev = index === 0 ? value : value * k + prev * (1 - k);
      result.push(prev);
    });
    return result;
  }

  function rsi(values, period = 14) {
    const result = new Array(values.length).fill(50);
    if (values.length <= period) return result;

    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const change = values[i] - values[i - 1];
      if (change >= 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    for (let i = period + 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
      result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return result;
  }

  function macd(values) {
    const fast = ema(values, 12);
    const slow = ema(values, 26);
    const line = values.map((_, index) => fast[index] - slow[index]);
    const signal = ema(line, 9);
    const histogram = line.map((value, index) => value - signal[index]);
    return { line, signal, histogram };
  }

  function bollinger(values, period = 20, multiplier = 2) {
    return values.map((_, index) => {
      if (index < period - 1) return { mid: null, upper: null, lower: null, width: null };
      const slice = values.slice(index - period + 1, index + 1);
      const mid = avg(slice);
      const variance = avg(slice.map(value => (value - mid) ** 2));
      const deviation = Math.sqrt(variance);
      return {
        mid,
        upper: mid + deviation * multiplier,
        lower: mid - deviation * multiplier,
        width: mid ? (deviation * multiplier * 2) / mid : null
      };
    });
  }

  function atr(highs, lows, closes, period = 14) {
    const trueRanges = highs.map((high, index) => {
      if (index === 0) return high - lows[index];
      return Math.max(high - lows[index], Math.abs(high - closes[index - 1]), Math.abs(lows[index] - closes[index - 1]));
    });
    return sma(trueRanges, period);
  }

  function dailyReturns(values) {
    const returns = [];
    for (let i = 1; i < values.length; i++) returns.push(values[i] / values[i - 1] - 1);
    return returns.filter(Number.isFinite);
  }

  function volatility(values, lookback = 30) {
    const returns = dailyReturns(values).slice(-lookback);
    const mean = avg(returns);
    const variance = avg(returns.map(value => (value - mean) ** 2));
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  function maxDrawdown(values) {
    let peak = values[0] || 1;
    let worst = 0;
    values.forEach(value => {
      if (value > peak) peak = value;
      worst = Math.min(worst, value / peak - 1);
    });
    return worst;
  }

  function slopeScore(values, lookback) {
    if (values.length <= lookback) return 50;
    const now = values[values.length - 1];
    const then = values[values.length - 1 - lookback];
    const move = now / then - 1;
    return clamp(50 + move * 260, 0, 100);
  }

  function scoreData(data) {
    const closes = data.closes;
    const highs = data.highs;
    const lows = data.lows;
    const volumes = data.volumes;
    const last = closes.length - 1;
    const ma20 = sma(closes, 20);
    const ma60 = sma(closes, 60);
    const rsi14 = rsi(closes, 14);
    const macdData = macd(closes);
    const bb = bollinger(closes, 20);
    const atr14 = atr(highs, lows, closes, 14);
    const vol20 = sma(volumes, 20);

    const price = closes[last];
    const momentum = slopeScore(closes, Math.min(60, closes.length - 1));
    const trendBase = ma60[last] ? (price / ma60[last] - 1) : 0;
    const trend = clamp(50 + trendBase * 280 + (ma20[last] > ma60[last] ? 8 : -8), 0, 100);
    const rsiValue = rsi14[last];
    const rsiScore = rsiValue < 30 ? 72 : rsiValue > 75 ? 28 : clamp(100 - Math.abs(rsiValue - 52) * 1.55, 0, 100);
    const macdScore = clamp(50 + macdData.histogram[last] / price * 9000, 0, 100);
    const latestBB = bb[last];
    const bbPosition = latestBB.upper && latestBB.lower ? (price - latestBB.lower) / (latestBB.upper - latestBB.lower) : 0.5;
    const volatilityValue = volatility(closes);
    const riskScore = clamp(100 - volatilityValue * 145, 0, 100);
    const volumeRatio = vol20[last] ? volumes[last] / vol20[last] : 1;
    const volumeScore = clamp(50 + (volumeRatio - 1) * 28 + (data.changePct > 0 ? 6 : -4), 0, 100);
    const bbScore = clamp(55 + (0.5 - Math.abs(bbPosition - 0.55)) * 60, 0, 100);

    const factors = [
      { key: "trend", name: "Trend", score: trend },
      { key: "momentum", name: "Momentum", score: momentum },
      { key: "rsi", name: "RSI", score: rsiScore },
      { key: "macd", name: "MACD", score: macdScore },
      { key: "volume", name: "Volume", score: volumeScore },
      { key: "volatility", name: "Volatility", score: riskScore },
      { key: "bands", name: "Band position", score: bbScore }
    ];

    const weights = { trend: 0.2, momentum: 0.18, rsi: 0.14, macd: 0.14, volume: 0.12, volatility: 0.12, bands: 0.1 };
    const score = factors.reduce((sum, item) => sum + item.score * weights[item.key], 0);
    const atrValue = atr14[last] || price * volatilityValue / Math.sqrt(252) || price * 0.025;
    const support = Math.min(latestBB.lower || price - atrValue * 2, price - atrValue * 1.35);
    const resistance = Math.max(latestBB.upper || price + atrValue * 2, price + atrValue * 1.55);

    let verdict = "Neutral";
    let tone = "neutral";
    if (score >= 72) { verdict = "Bullish"; tone = "bull"; }
    if (score >= 84) { verdict = "Strong bullish"; tone = "bull"; }
    if (score <= 42) { verdict = "Weak"; tone = "bear"; }
    if (score <= 30) { verdict = "High risk"; tone = "bear"; }

    const confidence = clamp(52 + Math.abs(score - 50) * 0.78 + Math.max(0, 18 - volatilityValue * 100), 45, 94);
    const target1 = price + atrValue * (score >= 50 ? 1.8 : 1.0);
    const target2 = price + atrValue * (score >= 50 ? 3.0 : 1.8);
    const stopLoss = Math.max(price - atrValue * (score >= 55 ? 1.6 : 1.1), price * 0.72);
    const rr = (target1 - price) / Math.max(price - stopLoss, price * 0.005);

    return {
      score,
      confidence,
      verdict,
      tone,
      factors,
      indicators: {
        ma20: ma20[last],
        ma60: ma60[last],
        rsi: rsiValue,
        macdHistogram: macdData.histogram[last],
        bb: latestBB,
        atr: atrValue,
        volatility: volatilityValue,
        volumeRatio
      },
      targets: {
        target1,
        target2,
        stopLoss,
        support,
        resistance,
        monthLow: price - atrValue * 2.2,
        monthHigh: price + atrValue * 2.4,
        halfYearLow: price * (1 - volatilityValue * 0.42),
        halfYearHigh: price * (1 + volatilityValue * 0.5),
        riskReward: rr
      },
      reason: makeReason(score, rsiValue, trendBase, volumeRatio, volatilityValue)
    };
  }

  function makeReason(score, rsiValue, trendBase, volumeRatio, volatilityValue) {
    const parts = [];
    parts.push(score >= 60 ? "trend score is above neutral" : score <= 45 ? "trend and momentum are still defensive" : "bull and bear signals are balanced");
    if (rsiValue >= 70) parts.push("RSI is hot, so chase risk is higher");
    else if (rsiValue <= 35) parts.push("RSI is near a rebound zone");
    else parts.push("RSI is in a healthy middle range");
    if (trendBase > 0.05) parts.push("price is above the medium-term average");
    if (volumeRatio > 1.25) parts.push("volume is above recent average");
    if (volatilityValue > 0.45) parts.push("annualized volatility is elevated");
    return parts.join(", ") + ".";
  }

  function runBacktest(data, strategyType = "ensemble", initialCapital = 100000) {
    const closes = data.closes;
    const dates = data.dates;
    const ma10 = sma(closes, 10);
    const ma30 = sma(closes, 30);
    const rsi14 = rsi(closes, 14);
    let cash = initialCapital;
    let shares = 0;
    let entry = 0;
    const equity = [];
    const trades = [];

    for (let i = 60; i < closes.length; i++) {
      const price = closes[i];
      const previousPrice = closes[i - 1];
      let buy = false;
      let sell = false;

      if (strategyType === "maCross") {
        buy = ma10[i] > ma30[i] && ma10[i - 1] <= ma30[i - 1];
        sell = ma10[i] < ma30[i] && ma10[i - 1] >= ma30[i - 1];
      } else if (strategyType === "rsiRebound") {
        buy = rsi14[i - 1] < 35 && rsi14[i] >= 35;
        sell = rsi14[i] > 70 || price < entry * 0.93;
      } else if (strategyType === "trendRide") {
        buy = price > ma30[i] && previousPrice <= ma30[i - 1];
        sell = price < ma30[i] || price < entry * 0.92;
      } else {
        const partial = {
          ...data,
          closes: closes.slice(0, i + 1),
          highs: data.highs.slice(0, i + 1),
          lows: data.lows.slice(0, i + 1),
          volumes: data.volumes.slice(0, i + 1),
          changePct: closes[i] / closes[i - 1] - 1
        };
        const signal = scoreData(partial);
        buy = signal.score >= 68 && price > ma30[i];
        sell = signal.score <= 44 || price < entry * 0.92;
      }

      if (!shares && buy) {
        shares = cash / price;
        cash = 0;
        entry = price;
        trades.push({ type: "buy", date: dates[i], price });
      } else if (shares && sell) {
        const value = shares * price;
        trades.push({ type: "sell", date: dates[i], price, profitPct: price / entry - 1 });
        cash = value;
        shares = 0;
      }

      equity.push(shares ? shares * price : cash);
    }

    if (shares) {
      const price = closes[closes.length - 1];
      trades.push({ type: "sell", date: dates[dates.length - 1], price, profitPct: price / entry - 1 });
      cash = shares * price;
      shares = 0;
    }

    const sells = trades.filter(trade => trade.type === "sell");
    const totalReturn = equity.length ? equity[equity.length - 1] / initialCapital - 1 : 0;
    const winRate = sells.length ? sells.filter(trade => trade.profitPct > 0).length / sells.length : 0;
    const years = Math.max(closes.length / 252, 0.1);
    const cagr = Math.pow(1 + totalReturn, 1 / years) - 1;

    return {
      equity,
      dates: dates.slice(Math.max(0, dates.length - equity.length)),
      trades,
      metrics: {
        totalReturn,
        cagr,
        maxDrawdown: maxDrawdown(equity),
        winRate,
        tradeCount: sells.length
      }
    };
  }

  window.StockStrategy = {
    sma,
    ema,
    rsi,
    macd,
    bollinger,
    atr,
    volatility,
    maxDrawdown,
    scoreData,
    runBacktest,
    clamp
  };
})();
