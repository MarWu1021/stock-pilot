(() => {
  const $ = selector => document.querySelector(selector);
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const pct = value => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
  const text = {
    loading: "\u6b63\u5728\u8b80\u53d6\u50f9\u683c\u8cc7\u6599",
    fallback: "\u5373\u6642\u8cc7\u6599\u88ab\u963b\u64cb\u6216\u66ab\u6642\u7121\u6cd5\u4f7f\u7528\uff0c\u5df2\u6539\u7528\u672c\u6a5f\u6a21\u64ec\u8cc7\u6599\u3002",
    simulatedBadge: "\u6a21\u64ec\u8cc7\u6599",
    simulatedPrefix: "SIM",
    liveMode: "\u5373\u6642\u2713 \u6bcf 60 \u79d2\u81ea\u52d5\u66f4\u65b0",
    failed: "\u5206\u6790\u5931\u6557\uff0c\u8acb\u78ba\u8a8d\u4ee3\u865f\u662f\u5426\u6b63\u78ba\u3002",
    confidence: "\u4fe1\u5fc3",
    score: "\u5206\u6578",
    highVol: "\u9ad8\u6ce2\u52d5",
    bullStructure: "\u591a\u982d\u7d50\u69cb",
    weakStructure: "\u5f31\u52e2\u6574\u7406",
    rangeWatch: "\u76e4\u6574\u89c0\u5bdf",
    add: "\u52a0\u5165",
    remove: "\u79fb\u9664",
    emptyWatch: "\u9084\u6c92\u6709\u89c0\u5bdf\u6a19\u7684\u3002\u5206\u6790\u5f8c\u53ef\u52a0\u5165\u6e05\u55ae\u3002",
    scanning: "\u6383\u63cf\u4e2d...",
    needSymbol: "\u81f3\u5c11\u8f38\u5165\u4e00\u500b\u4ee3\u865f\u624d\u80fd\u6383\u63cf\u3002",
    noMatch: "\u6c92\u6709\u7b26\u5408\u76ee\u524d\u7be9\u9078\u689d\u4ef6\u7684\u6a19\u7684\u3002",
    open: "\u958b\u555f",
    emptyGuard: "\u9084\u6c92\u6709\u76ef\u76e4\u898f\u5247\u3002\u5148\u5206\u6790\u4e00\u6a94\u80a1\u7968\uff0c\u518d\u5132\u5b58\u76ee\u524d\u898f\u5247\u3002",
    emptyAlert: "\u6309\u4e0b\u4e00\u9375\u6aa2\u67e5\u5f8c\uff0c\u9019\u88e1\u6703\u7522\u751f LINE \u901a\u77e5\u6458\u8981\u3002",
    guardSaved: "\u5df2\u5132\u5b58\u76ef\u76e4\u898f\u5247",
    guardChecking: "\u6b63\u5728\u6aa2\u67e5\u76ef\u76e4\u6e05\u55ae...",
    guardDone: "\u76ef\u76e4\u6aa2\u67e5\u5b8c\u6210",
    guardReady: "\u53ef\u5217\u5165\u89c0\u5bdf",
    guardPriceHit: "\u9054\u5230\u7406\u60f3\u8cb7\u5165\u50f9",
    guardRiskMode: "\u505c\u5229 / \u505c\u640d\u63d0\u9192",
    guardWatch: "\u7b49\u5f85\u689d\u4ef6",
    guardDanger: "\u98a8\u96aa\u63d0\u9192",
    notifySending: "\u6b63\u5728\u767c\u9001 Discord \u901a\u77e5...",
    notifySent: "Discord \u901a\u77e5\u5df2\u9001\u51fa",
    notifyFailed: "Discord \u901a\u77e5\u5931\u6557\uff0c\u8acb\u78ba\u8a8d Vercel \u74b0\u5883\u8b8a\u6578 DISCORD_WEBHOOK_URL \u5df2\u8a2d\u5b9a\u3002"
  };

  const names = {
    "2330": "\u53f0\u7a4d\u96fb", "2317": "\u9d3b\u6d77", "2454": "\u806f\u767c\u79d1", "2303": "\u806f\u96fb", "2308": "\u53f0\u9054\u96fb",
    "2412": "\u4e2d\u83ef\u96fb", "2382": "\u5ee3\u9054", "2357": "\u83ef\u78a9", "2881": "\u5bcc\u90a6\u91d1", "2882": "\u570b\u6cf0\u91d1",
    "0050": "\u5143\u5927\u53f0\u706350", "0056": "\u5143\u5927\u9ad8\u80a1\u606f", "00878": "\u570b\u6cf0\u6c38\u7e8c\u9ad8\u80a1\u606f", "006208": "\u5bcc\u90a6\u53f050",
    "00919": "\u7fa4\u76ca\u53f0\u7063\u7cbe\u9078\u9ad8\u606f", "AAPL": "Apple", "MSFT": "Microsoft", "NVDA": "NVIDIA", "TSLA": "Tesla"
  };

  const popularSymbols = ["2330", "2317", "2454", "2303", "2308", "2382", "0050", "0056", "00878", "006208"];
  const state = {
    data: null,
    analysis: null,
    chartMode: "line",
    scannerRows: [],
    refreshTimer: null,
    guardTimer: null,
    guardSyncedSymbol: null,
    watchlist: JSON.parse(localStorage.getItem("stockPilotWatchlist") || "[]"),
    guardRules: JSON.parse(localStorage.getItem("stockPilotGuardRules") || "[]"),
    guardAlerts: JSON.parse(localStorage.getItem("stockPilotGuardAlerts") || "[]")
  };

  const elements = {
    input: $("#stockInput"),
    analyzeBtn: $("#analyzeBtn"),
    range: $("#rangeSelect"),
    cost: $("#costInput"),
    strategy: $("#strategySelect"),
    status: $("#statusBox"),
    result: $("#resultSection"),
    priceChart: $("#priceChart"),
    equityChart: $("#equityChart"),
    watchBtn: $("#watchBtn"),
    scanBtn: $("#scanBtn"),
    scannerSymbols: $("#scannerSymbols"),
    scannerMinScore: $("#scannerMinScore"),
    scannerSignal: $("#scannerSignal"),
    scannerSort: $("#scannerSort"),
    guardMode: $("#guardMode"),
    guardEntry: $("#guardEntry"),
    guardStop: $("#guardStop"),
    guardTarget: $("#guardTarget"),
    guardMinScore: $("#guardMinScore"),
    guardMinRr: $("#guardMinRr"),
    guardFrequency: $("#guardFrequency"),
    guardAddBtn: $("#guardAddBtn"),
    guardRunBtn: $("#guardRunBtn"),
    notifyTestBtn: $("#notifyTestBtn"),
    clearAlertsBtn: $("#clearAlertsBtn")
  };

  function normalizeSymbol(raw) {
    const value = raw.trim().toUpperCase();
    if (!value) return "";
    if (value.endsWith(".TW") || value.endsWith(".TWO")) return value;
    if (/^\d{4,6}[A-Z]?$/.test(value)) return `${value}.TW`;
    return value;
  }

  function parseScannerSymbols() {
    const source = elements.scannerSymbols.value.trim() || popularSymbols.join(",");
    const unique = new Set();
    source
      .split(/[\s,;]+/)
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => unique.add(normalizeSymbol(item)));
    return [...unique].slice(0, 30);
  }

  function bareSymbol(symbol) {
    return symbol.replace(".TW", "").replace(".TWO", "");
  }

  function displayName(symbol) {
    const bare = bareSymbol(symbol);
    return names[bare] || names[symbol] || symbol;
  }

  function currencyFor(symbol) {
    return symbol.endsWith(".TW") || symbol.endsWith(".TWO") ? "NT$" : "$";
  }

  function showStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.classList.toggle("error", isError);
    elements.status.classList.remove("hidden");
  }

  function hideStatus() {
    elements.status.classList.add("hidden");
  }

  async function fetchJson(url) {
    const proxies = [
      target => target,
      target => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
      target => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
      target => `https://corsproxy.io/?${encodeURIComponent(target)}`
    ];

    let lastError = null;
    for (const makeUrl of proxies) {
      try {
        const response = await fetch(makeUrl(url), { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Data source did not respond");
  }

  function selectedInterval() {
    if (elements.range.value === "1d") return "1m";
    if (elements.range.value === "5d") return "5m";
    return "1d";
  }

  function isLiveRange() {
    return elements.range.value === "1d" || elements.range.value === "5d";
  }

  async function fetchYahooChart(symbol) {
    const range = elements.range.value;
    const interval = selectedInterval();
    const backendUrl = `/api/yahoo?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}&interval=${interval}`;
    try {
      return await fetchJson(backendUrl);
    } catch {
      const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includeAdjustedClose=true`;
      return fetchJson(yahooUrl);
    }
  }

  async function fetchStockData(symbol) {
    const json = await fetchYahooChart(symbol);
    const result = json?.chart?.result?.[0];
    if (!result?.timestamp?.length) throw new Error("No price data found");

    const quote = result.indicators.quote[0];
    const rows = result.timestamp.map((time, index) => ({
      date: new Date(time * 1000),
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
      volume: quote.volume[index] || 0
    })).filter(row => [row.open, row.high, row.low, row.close].every(Number.isFinite));

    if (rows.length < 65) throw new Error("Not enough data for indicators");
    return buildData(symbol, rows);
  }

  function buildData(symbol, rows, options = {}) {
    const closes = rows.map(row => row.close);
    const previous = closes[closes.length - 2] || closes[0];
    const current = closes[closes.length - 1];
    return {
      symbol,
      name: displayName(symbol),
      currency: currencyFor(symbol),
      dates: rows.map(row => row.date),
      opens: rows.map(row => row.open),
      highs: rows.map(row => row.high),
      lows: rows.map(row => row.low),
      closes,
      volumes: rows.map(row => row.volume),
      currentPrice: current,
      previousClose: previous,
      change: current - previous,
      changePct: current / previous - 1,
      isSimulated: Boolean(options.isSimulated),
      source: options.source || "Yahoo Finance"
    };
  }

  function seededRandom(seed) {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  function makeFallbackData(symbol) {
    const bare = bareSymbol(symbol);
    const seed = [...bare].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const random = seededRandom(seed || 42);
    const days = elements.range.value === "5y" ? 980 : elements.range.value === "2y" ? 520 : elements.range.value === "3mo" ? 110 : 252;
    const base = bare.startsWith("00") ? 45 + random() * 70 : /^\d/.test(bare) ? 80 + random() * 650 : 90 + random() * 260;
    const trend = (random() - 0.43) / 420;
    let price = base;
    const rows = [];

    if (isLiveRange()) {
      const bars = elements.range.value === "1d" ? 180 : 320;
      const stepMinutes = elements.range.value === "1d" ? 1 : 5;
      for (let i = bars; i >= 0; i--) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i * stepMinutes);
        const cycle = Math.sin((bars - i) / 24) * 0.0018;
        const shock = (random() - 0.5) * 0.0045;
        const open = price;
        price = Math.max(4, price * (1 + trend / 6 + cycle + shock));
        const high = Math.max(open, price) * (1 + random() * 0.0025);
        const low = Math.min(open, price) * (1 - random() * 0.0025);
        rows.push({ date, open, high, low, close: price, volume: Math.round((100 + random() * 1400) * 1000) });
      }
      return buildData(symbol, rows, { isSimulated: true, source: "Local demo data" });
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      const cycle = Math.sin((days - i) / 19) * 0.011;
      const shock = (random() - 0.49) * 0.035;
      const open = price * (1 + (random() - 0.5) * 0.015);
      price = Math.max(4, price * (1 + trend + cycle + shock));
      const high = Math.max(open, price) * (1 + random() * 0.018);
      const low = Math.min(open, price) * (1 - random() * 0.018);
      rows.push({ date, open, high, low, close: price, volume: Math.round((8000 + random() * 65000) * 1000) });
    }
    return buildData(symbol, rows, { isSimulated: true, source: "Local demo data" });
  }

  async function analyze(symbol = normalizeSymbol(elements.input.value)) {
    if (!symbol) {
      elements.input.focus();
      return;
    }

    elements.analyzeBtn.disabled = true;
    showStatus(`${text.loading} ${symbol}...`);

    try {
      let data;
      try {
        data = await fetchStockData(symbol);
        hideStatus();
      } catch {
        data = makeFallbackData(symbol);
        showStatus(`${text.fallback} (${symbol})`, true);
      }

      state.data = data;
      state.analysis = StockStrategy.scoreData(data);
      elements.input.value = bareSymbol(symbol);
      elements.result.classList.remove("hidden");
      renderAll();
      configureAutoRefresh();
      if (!data.isSimulated && isLiveRange()) showStatus(text.liveMode);
      elements.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showStatus(error.message || text.failed, true);
    } finally {
      elements.analyzeBtn.disabled = false;
    }
  }

  function configureAutoRefresh() {
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
      state.refreshTimer = null;
    }
    if (!state.data || !isLiveRange()) return;
    state.refreshTimer = setInterval(() => {
      if (document.hidden || elements.analyzeBtn.disabled) return;
      analyze(state.data.symbol);
    }, 60000);
  }

  function renderAll() {
    renderSummary();
    drawPriceChart(elements.priceChart, state.data, state.chartMode);
    renderFactors();
    renderTargets();
    syncGuardInputs();
    renderGuardPanel();
    renderBacktest();
    renderWatchlist();
  }

  function renderSummary() {
    const data = state.data;
    const analysis = state.analysis;
    $("#stockName").textContent = data.name;
    $("#stockSymbol").textContent = data.isSimulated ? `${data.symbol} \u00b7 ${text.simulatedBadge}` : data.symbol;
    $("#currentPrice").textContent = `${data.isSimulated ? `${text.simulatedPrefix} ` : ""}${data.currency}${fmt.format(data.currentPrice)}`;
    const change = $("#priceChange");
    change.textContent = `${data.change >= 0 ? "+" : ""}${fmt.format(data.change)} (${pct(data.changePct)})`;
    change.className = data.change > 0 ? "up" : data.change < 0 ? "down" : "flat";

    const card = $("#verdictCard");
    card.className = `verdict-card ${analysis.tone}`;
    $("#verdictText").textContent = analysis.verdict;
    $("#confidenceText").textContent = `${text.confidence} ${analysis.confidence.toFixed(0)} / ${text.score} ${analysis.score.toFixed(0)}`;
    $("#confidenceMeter").style.width = `${analysis.score.toFixed(0)}%`;
    $("#verdictReason").textContent = analysis.reason;

    const regime = $("#regimeBadge");
    const vol = analysis.indicators.volatility;
    regime.textContent = vol > 0.45 ? text.highVol : analysis.score > 65 ? text.bullStructure : analysis.score < 42 ? text.weakStructure : text.rangeWatch;
    regime.className = `pill ${vol > 0.45 ? "warn" : analysis.score > 65 ? "good" : analysis.score < 42 ? "bad" : ""}`;
  }

  function renderFactors() {
    $("#factorList").innerHTML = state.analysis.factors.map(item => `
      <div class="factor-row">
        <span class="factor-name">${item.name}</span>
        <span class="factor-track"><span class="factor-fill" style="width:${item.score.toFixed(0)}%"></span></span>
        <span class="factor-score">${item.score.toFixed(0)}</span>
      </div>
    `).join("");
  }

  function renderTargets() {
    const data = state.data;
    const targets = state.analysis.targets;
    const money = value => `${data.isSimulated ? `${text.simulatedPrefix} ` : ""}${data.currency}${fmt.format(value)}`;
    const rr = $("#riskRewardBadge");
    rr.textContent = `R/R ${targets.riskReward.toFixed(2)}`;
    rr.className = `pill ${targets.riskReward >= 1.6 ? "good" : targets.riskReward >= 1 ? "warn" : "bad"}`;
    $("#targetTable").innerHTML = `
      <tr><td>\u7b2c\u4e00\u76ee\u6a19</td><td><strong>${money(targets.target1)}</strong></td><td>\u7d04 ${pct(targets.target1 / data.currentPrice - 1)}</td></tr>
      <tr><td>\u7b2c\u4e8c\u76ee\u6a19</td><td><strong>${money(targets.target2)}</strong></td><td>\u52d5\u80fd\u5ef6\u4f38\u60c5\u5883</td></tr>
      <tr><td>\u505c\u640d\u53c3\u8003</td><td><strong>${money(targets.stopLoss)}</strong></td><td>${pct(targets.stopLoss / data.currentPrice - 1)}</td></tr>
      <tr><td>\u652f\u6490 / \u58d3\u529b</td><td><strong>${money(targets.support)} - ${money(targets.resistance)}</strong></td><td>ATR + Bollinger</td></tr>
      <tr><td>1 \u500b\u6708\u60c5\u5883</td><td><strong>${money(targets.monthLow)} - ${money(targets.monthHigh)}</strong></td><td>\u77ed\u7dda\u6ce2\u52d5\u5340\u9593</td></tr>
      <tr><td>6 \u500b\u6708\u60c5\u5883</td><td><strong>${money(targets.halfYearLow)} - ${money(targets.halfYearHigh)}</strong></td><td>\u5e74\u5316\u6ce2\u52d5\u63a8\u4f30</td></tr>
    `;
    renderProfitLoss();
  }

  function renderProfitLoss() {
    const cost = Number(elements.cost.value);
    const box = $("#plBox");
    if (!cost || !state.data) {
      box.classList.add("hidden");
      return;
    }
    const data = state.data;
    const targets = state.analysis.targets;
    const now = data.currentPrice / cost - 1;
    const tp = targets.target1 / cost - 1;
    const sl = targets.stopLoss / cost - 1;
    box.classList.remove("hidden");
    box.innerHTML = `\u9032\u5834\u6210\u672c ${data.currency}${fmt.format(cost)}: \u76ee\u524d\u640d\u76ca <strong class="${now >= 0 ? "up" : "down"}">${pct(now)}</strong>, \u7b2c\u4e00\u76ee\u6a19\u640d\u76ca <strong class="${tp >= 0 ? "up" : "down"}">${pct(tp)}</strong>, \u505c\u640d\u640d\u76ca <strong class="${sl >= 0 ? "up" : "down"}">${pct(sl)}</strong>.`;
  }

  function drawPriceChart(canvas, data, mode = "line") {
    const ctx = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pad = { top: 18, right: 18, bottom: 34, left: 58 };
    const closes = data.closes;
    const ma20 = StockStrategy.sma(closes, 20);
    const ma60 = StockStrategy.sma(closes, 60);
    const min = Math.min(...data.lows) * 0.985;
    const max = Math.max(...data.highs) * 1.015;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const x = index => pad.left + (index / Math.max(1, closes.length - 1)) * plotW;
    const y = value => pad.top + (1 - (value - min) / (max - min)) * plotH;

    ctx.clearRect(0, 0, width, height);
    drawGrid(ctx, width, height, pad, min, max, data.currency);
    if (mode === "candle") drawCandles(ctx, data, x, y, plotW);
    else drawLine(ctx, closes, x, y, "#22d3ee", 2.2, true);
    drawLine(ctx, ma20, x, y, "#f59e0b", 1.5);
    drawLine(ctx, ma60, x, y, "#8b5cf6", 1.5);
    drawChartLabels(ctx, data, x, height);
    drawLegend(ctx, width);
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawGrid(ctx, width, height, pad, min, max, currency) {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.fillStyle = "#52657f";
    ctx.font = "11px JetBrains Mono";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + ((height - pad.top - pad.bottom) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      const value = max - ((max - min) / 4) * i;
      ctx.fillText(`${currency}${fmt.format(value)}`, pad.left - 8, y + 4);
    }
  }

  function drawLine(ctx, values, x, y, color, lineWidth = 1.5, fill = false) {
    ctx.beginPath();
    let started = false;
    values.forEach((value, index) => {
      if (!Number.isFinite(value)) return;
      if (!started) {
        ctx.moveTo(x(index), y(value));
        started = true;
      } else {
        ctx.lineTo(x(index), y(value));
      }
    });
    if (fill && started) {
      const height = ctx.canvas.clientHeight || 170;
      const gradient = ctx.createLinearGradient(0, 30, 0, height);
      gradient.addColorStop(0, "rgba(34, 211, 238, 0.22)");
      gradient.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.lineTo(x(values.length - 1), height - 34);
      ctx.lineTo(x(0), height - 34);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.beginPath();
      started = false;
      values.forEach((value, index) => {
        if (!Number.isFinite(value)) return;
        if (!started) { ctx.moveTo(x(index), y(value)); started = true; }
        else ctx.lineTo(x(index), y(value));
      });
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function drawCandles(ctx, data, x, y, plotW) {
    const candleW = Math.max(3, Math.min(14, plotW / data.closes.length * 0.58));
    data.closes.forEach((close, index) => {
      const open = data.opens[index];
      const high = data.highs[index];
      const low = data.lows[index];
      const color = close >= open ? "#22c55e" : "#ef4444";
      const cx = x(index);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, y(high));
      ctx.lineTo(cx, y(low));
      ctx.stroke();
      ctx.fillStyle = color;
      const top = Math.min(y(open), y(close));
      const bodyH = Math.max(1, Math.abs(y(open) - y(close)));
      ctx.fillRect(cx - candleW / 2, top, candleW, bodyH);
    });
  }

  function drawChartLabels(ctx, data, x, height) {
    ctx.fillStyle = "#52657f";
    ctx.font = "11px Inter";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const index = Math.round((data.dates.length - 1) * (i / 5));
      const date = data.dates[index];
      ctx.fillText(`${date.getMonth() + 1}/${date.getDate()}`, x(index), height - 12);
    }
  }

  function drawLegend(ctx, width) {
    const items = [["\u50f9\u683c", "#22d3ee"], ["MA20", "#f59e0b"], ["MA60", "#8b5cf6"]];
    ctx.font = "12px Inter";
    ctx.textAlign = "left";
    items.forEach((item, index) => {
      const x = width - 190 + index * 62;
      ctx.fillStyle = item[1];
      ctx.fillRect(x, 16, 14, 3);
      ctx.fillText(item[0], x + 18, 20);
    });
  }

  function renderBacktest() {
    if (!state.data) return;
    const result = StockStrategy.runBacktest(state.data, elements.strategy.value);
    drawEquityChart(elements.equityChart, result);
    $("#backtestMetrics").innerHTML = [
      ["\u7e3d\u5831\u916c", pct(result.metrics.totalReturn), result.metrics.totalReturn >= 0 ? "up" : "down"],
      ["\u5e74\u5316", pct(result.metrics.cagr), result.metrics.cagr >= 0 ? "up" : "down"],
      ["\u52dd\u7387", `${(result.metrics.winRate * 100).toFixed(1)}%`, ""],
      ["\u6700\u5927\u56de\u64a4", pct(result.metrics.maxDrawdown), "down"],
      ["\u4ea4\u6613\u6578", result.metrics.tradeCount, ""]
    ].map(item => `<div class="metric"><span>${item[0]}</span><strong class="${item[2]}">${item[1]}</strong></div>`).join("");
  }

  function drawEquityChart(canvas, result) {
    const ctx = prepareCanvas(canvas);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const values = result.equity.length ? result.equity : [100000];
    const min = Math.min(...values) * 0.985;
    const max = Math.max(...values) * 1.015;
    const x = index => 10 + (index / Math.max(1, values.length - 1)) * (width - 20);
    const y = value => 14 + (1 - (value - min) / (max - min || 1)) * (height - 28);
    ctx.clearRect(0, 0, width, height);
    drawLine(ctx, values, x, y, "#22c55e", 2, true);
  }

  function saveWatchlist() {
    localStorage.setItem("stockPilotWatchlist", JSON.stringify(state.watchlist));
  }

  function renderWatchlist() {
    const exists = state.data && state.watchlist.some(item => item.symbol === state.data.symbol);
    elements.watchBtn.textContent = exists ? text.remove : text.add;
    const wrap = $("#watchlist");
    if (!state.watchlist.length) {
      wrap.innerHTML = `<p class="muted">${text.emptyWatch}</p>`;
      return;
    }
    wrap.innerHTML = state.watchlist.map(item => `
      <div class="watch-item">
        <strong>${item.name}</strong>
        <button type="button" data-load="${item.symbol}">${bareSymbol(item.symbol)}</button>
        <button type="button" data-remove="${item.symbol}">${text.remove}</button>
      </div>
    `).join("");
  }

  function toggleWatch() {
    if (!state.data) return;
    const index = state.watchlist.findIndex(item => item.symbol === state.data.symbol);
    if (index >= 0) state.watchlist.splice(index, 1);
    else state.watchlist.push({ symbol: state.data.symbol, name: state.data.name });
    saveWatchlist();
    renderWatchlist();
  }

  function saveGuardRules() {
    localStorage.setItem("stockPilotGuardRules", JSON.stringify(state.guardRules));
  }

  function saveGuardAlerts() {
    localStorage.setItem("stockPilotGuardAlerts", JSON.stringify(state.guardAlerts.slice(0, 12)));
  }

  function syncGuardInputs() {
    if (!state.data || !state.analysis) return;
    if (state.guardSyncedSymbol !== state.data.symbol) {
      elements.guardEntry.value = state.data.currentPrice.toFixed(2);
      elements.guardStop.value = state.analysis.targets.stopLoss.toFixed(2);
      elements.guardTarget.value = state.analysis.targets.target1.toFixed(2);
      state.guardSyncedSymbol = state.data.symbol;
    }
    $("#guardReason").textContent = state.analysis.reason;
  }

  function makeGuardRule() {
    if (!state.data || !state.analysis) return null;
    return {
      symbol: state.data.symbol,
      name: state.data.name,
      mode: elements.guardMode.value,
      entry: Number(elements.guardEntry.value) || null,
      stop: Number(elements.guardStop.value) || state.analysis.targets.stopLoss,
      target: Number(elements.guardTarget.value) || state.analysis.targets.target1,
      minScore: Number(elements.guardMinScore.value) || 68,
      minRr: Number(elements.guardMinRr.value) || 1.5,
      reason: state.analysis.reason,
      updatedAt: new Date().toISOString()
    };
  }

  function addGuardRule() {
    const rule = makeGuardRule();
    if (!rule) return;
    const index = state.guardRules.findIndex(item => item.symbol === rule.symbol);
    if (index >= 0) state.guardRules[index] = rule;
    else state.guardRules.push(rule);
    saveGuardRules();
    renderGuardPanel();
    showStatus(`${text.guardSaved}: ${bareSymbol(rule.symbol)}`);
  }

  function removeGuardRule(symbol) {
    state.guardRules = state.guardRules.filter(item => item.symbol !== symbol);
    state.guardAlerts = state.guardAlerts.filter(item => item.symbol !== symbol);
    saveGuardRules();
    saveGuardAlerts();
    renderGuardPanel();
  }

  function removeGuardAlert(index) {
    state.guardAlerts.splice(index, 1);
    saveGuardAlerts();
    renderGuardPanel();
  }

  function clearGuardAlerts() {
    state.guardAlerts = [];
    saveGuardAlerts();
    renderGuardPanel();
  }

  function guardMoney(rule, value, data = state.data) {
    const currency = data?.currency || currencyFor(rule.symbol);
    return `${currency}${fmt.format(value)}`;
  }

  function guardModeLabel(mode = "ai") {
    if (mode === "price") return "\u7d14\u5230\u50f9";
    if (mode === "risk") return "\u505c\u5229 / \u505c\u640d";
    return "AI \u9632\u5446";
  }

  function evaluateGuard(rule, data, analysis) {
    const mode = rule.mode || "ai";
    const passedScore = analysis.score >= rule.minScore;
    const passedRr = analysis.targets.riskReward >= rule.minRr;
    const nearEntry = rule.entry ? data.currentPrice <= rule.entry : false;
    const hitTarget = rule.target ? data.currentPrice >= rule.target : false;
    const hitStop = rule.stop ? data.currentPrice <= rule.stop : false;
    const parts = [];
    let tone = "watch";
    let title = text.guardWatch;

    if (hitStop) {
      tone = "danger";
      title = text.guardDanger;
      parts.push(`\u8dcc\u7834\u505c\u640d ${guardMoney(rule, rule.stop, data)}`);
    }
    if (hitTarget) {
      tone = "ready";
      title = "\u9054\u5230\u505c\u5229\u76ee\u6a19";
      parts.push(`\u5df2\u5230\u76ee\u6a19 ${guardMoney(rule, rule.target, data)}`);
    }
    if (mode === "price" && nearEntry && !hitStop && !hitTarget) {
      tone = "ready";
      title = text.guardPriceHit;
      parts.push(`\u76ee\u524d\u50f9\u5df2\u4f4e\u65bc\u6216\u7b49\u65bc\u4f60\u8a2d\u5b9a\u7684\u8cb7\u5165\u50f9 ${guardMoney(rule, rule.entry, data)}`);
    }
    if (mode === "ai" && passedScore && passedRr && nearEntry && !hitStop) {
      tone = "ready";
      title = text.guardReady;
      parts.push(`AI \u5206\u6578 ${analysis.score.toFixed(0)} \u9054\u6a19`);
      parts.push(`R/R ${analysis.targets.riskReward.toFixed(2)} \u9054\u6a19`);
      parts.push(`\u50f9\u683c\u63a5\u8fd1\u7406\u60f3\u8cb7\u9ede ${guardMoney(rule, rule.entry, data)}`);
    }
    if (!parts.length) {
      if (mode === "price") parts.push(`\u7d14\u5230\u50f9\u6a21\u5f0f\uff1a\u7b49\u5f85\u80a1\u50f9 <= ${guardMoney(rule, rule.entry, data)}`);
      else if (mode === "risk") parts.push(`\u505c\u5229 / \u505c\u640d\u6a21\u5f0f\uff1a\u50c5\u5728\u9054\u5230\u76ee\u6a19\u6216\u8dcc\u7834\u505c\u640d\u6642\u63d0\u9192`);
      else {
        parts.push(`AI \u5206\u6578 ${analysis.score.toFixed(0)} / \u9580\u6abb ${rule.minScore}`);
        parts.push(`R/R ${analysis.targets.riskReward.toFixed(2)} / \u9580\u6abb ${rule.minRr}`);
      }
      if (rule.entry) parts.push(`\u8ddd\u96e2\u7406\u60f3\u8cb7\u9ede ${pct(data.currentPrice / rule.entry - 1)}`);
    }

    return {
      symbol: rule.symbol,
      name: rule.name,
      title,
      tone,
      price: data.currentPrice,
      changePct: data.changePct,
      score: analysis.score,
      rr: analysis.targets.riskReward,
      mode,
      message: parts.join("\uff1b"),
      checkedAt: new Date().toISOString(),
      simulated: data.isSimulated
    };
  }

  function formatNotifyPayload(alert) {
    return {
      title: `AI \u76ef\u76e4\u63d0\u9192\uff1a${alert.name} ${bareSymbol(alert.symbol)}`,
      status: alert.title,
      symbol: bareSymbol(alert.symbol),
      price: `${alert.simulated ? text.simulatedPrefix + " " : ""}${guardMoney(alert, alert.price)}`,
      change: pct(alert.changePct),
      score: alert.score.toFixed(0),
      rr: alert.rr.toFixed(2),
      message: alert.message,
      note: "\u9632\u5446\uff1a\u5148\u8b80 AI \u7406\u7531\uff0c\u518d\u6838\u5c0d\u5373\u6642\u80a1\u50f9\uff0c\u6700\u5f8c\u81ea\u5df1\u6c7a\u5b9a\u3002"
    };
  }

  function shouldNotify(alert) {
    return alert.tone !== "watch";
  }

  async function sendDiscordNotification(alert) {
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formatNotifyPayload(alert))
    });
    if (!response.ok) throw new Error("Discord notify failed");
    return response.json();
  }

  async function sendTestNotification() {
    if (!state.data || !state.analysis) return;
    elements.notifyTestBtn.disabled = true;
    showStatus(text.notifySending);
    const rule = makeGuardRule();
    const alert = evaluateGuard(rule, state.data, state.analysis);
    alert.title = "\u6e2c\u8a66\u901a\u77e5";
    try {
      await sendDiscordNotification(alert);
      showStatus(text.notifySent);
    } catch {
      showStatus(text.notifyFailed, true);
    } finally {
      elements.notifyTestBtn.disabled = false;
    }
  }

  async function runGuardCheck({ silent = false } = {}) {
    if (!state.guardRules.length) {
      renderGuardPanel();
      return;
    }
    elements.guardRunBtn.disabled = true;
    if (!silent) showStatus(text.guardChecking);
    const alerts = [];
    for (const rule of state.guardRules) {
      let data;
      try { data = await fetchStockData(rule.symbol); }
      catch { data = makeFallbackData(rule.symbol); }
      const analysis = StockStrategy.scoreData(data);
      const alert = evaluateGuard(rule, data, analysis);
      alerts.push(alert);
    }
    state.guardAlerts = alerts
      .concat(state.guardAlerts.filter(existing => !alerts.some(alert => alert.symbol === existing.symbol)))
      .slice(0, 12);
    saveGuardAlerts();
    renderGuardPanel();
    $("#guardLastCheck").textContent = `\u6700\u5f8c\u6aa2\u67e5 ${new Date().toLocaleString("zh-TW", { hour12: false })}`;
    const importantAlerts = alerts.filter(shouldNotify);
    for (const alert of importantAlerts) {
      try { await sendDiscordNotification(alert); }
      catch { if (!silent) showStatus(text.notifyFailed, true); }
    }
    if (!silent) showStatus(text.guardDone);
    elements.guardRunBtn.disabled = false;
  }

  function configureGuardTimer() {
    if (state.guardTimer) {
      clearInterval(state.guardTimer);
      state.guardTimer = null;
    }
    const seconds = Number(elements.guardFrequency.value);
    if (!seconds) return;
    state.guardTimer = setInterval(() => {
      if (document.hidden || elements.guardRunBtn.disabled) return;
      runGuardCheck({ silent: true });
    }, seconds * 1000);
  }

  function renderGuardPanel() {
    const rules = $("#guardRules");
    const alerts = $("#guardAlerts");
    rules.innerHTML = state.guardRules.length
      ? state.guardRules.map(rule => `
        <div class="guard-rule">
          <div>
            <strong>${rule.name} <span class="mono">${bareSymbol(rule.symbol)}</span></strong>
            <p>${guardModeLabel(rule.mode)} \u00b7 \u8cb7\u9ede ${rule.entry ? guardMoney(rule, rule.entry) : "--"} \u00b7 \u505c\u640d ${guardMoney(rule, rule.stop)} \u00b7 \u76ee\u6a19 ${guardMoney(rule, rule.target)} \u00b7 \u5206\u6578 ${rule.minScore}+ \u00b7 R/R ${rule.minRr}+</p>
          </div>
          <button type="button" data-remove-guard="${rule.symbol}">\u522a\u9664</button>
        </div>
      `).join("")
      : `<p class="muted">${text.emptyGuard}</p>`;

    alerts.innerHTML = state.guardAlerts.length
      ? state.guardAlerts.slice(0, 8).map((alert, index) => `
        <div class="guard-alert ${alert.tone}">
          <div>
            <strong>${alert.title} - ${alert.name} <span class="mono">${bareSymbol(alert.symbol)}</span></strong>
            <p>${alert.simulated ? text.simulatedPrefix + " " : ""}${guardMoney(alert, alert.price)} (${pct(alert.changePct)}) \u00b7 ${alert.message}</p>
            <p>\u96d9\u91cd\u6821\u9a57\uff1a\u5148\u8b80 AI \u7406\u7531\uff0c\u518d\u9ede\u9023\u7d50\u6838\u5c0d\u5373\u6642\u80a1\u50f9\uff0c\u6700\u5f8c\u81ea\u5df1\u6c7a\u5b9a\u3002</p>
          </div>
          <button type="button" data-remove-alert="${index}">\u522a\u9664</button>
        </div>
      `).join("")
      : `<p class="muted">${text.emptyAlert}</p>`;
  }

  async function scanMarket() {
    elements.scanBtn.disabled = true;
    const body = $("#scannerBody");
    body.innerHTML = `<tr><td colspan="8">${text.scanning}</td></tr>`;
    const rows = [];
    const symbols = parseScannerSymbols();
    if (!symbols.length) {
      body.innerHTML = `<tr><td colspan="8">${text.needSymbol}</td></tr>`;
      elements.scanBtn.disabled = false;
      return;
    }

    for (const symbol of symbols) {
      let data;
      try { data = await fetchStockData(symbol); }
      catch { data = makeFallbackData(symbol); }
      const analysis = StockStrategy.scoreData(data);
      rows.push({ data, analysis, scannedAt: new Date() });
      state.scannerRows = rows;
      renderScannerRows();
    }
    elements.scanBtn.disabled = false;
  }

  function renderScannerRows() {
    const body = $("#scannerBody");
    const minScore = Number(elements.scannerMinScore.value) || 0;
    const signal = elements.scannerSignal.value;
    const sortBy = elements.scannerSort.value;
    const rows = state.scannerRows
      .filter(row => row.analysis.score >= minScore)
      .filter(row => signal === "all" || row.analysis.tone === signal)
      .sort((a, b) => {
        if (sortBy === "changeDesc") return b.data.changePct - a.data.changePct;
        if (sortBy === "rrDesc") return b.analysis.targets.riskReward - a.analysis.targets.riskReward;
        if (sortBy === "symbolAsc") return bareSymbol(a.data.symbol).localeCompare(bareSymbol(a.data.symbol));
        return b.analysis.score - a.analysis.score;
      });

    body.innerHTML = rows.length
      ? rows.map(scannerRow).join("")
      : `<tr><td colspan="8">${text.noMatch}</td></tr>`;
  }

  function scannerRow(row) {
    const data = row.data;
    const analysis = row.analysis;
    const signalClass = analysis.tone === "bull" ? "up" : analysis.tone === "bear" ? "down" : "flat";
    return `
      <tr data-symbol="${data.symbol}">
        <td><strong>${bareSymbol(data.symbol)}</strong></td>
        <td>${data.name}</td>
        <td>${data.isSimulated ? `${text.simulatedPrefix} ` : ""}${data.currency}${fmt.format(data.currentPrice)}</td>
        <td class="${data.changePct >= 0 ? "up" : "down"}">${pct(data.changePct)}</td>
        <td>${analysis.score.toFixed(0)}</td>
        <td>${analysis.targets.riskReward.toFixed(2)}</td>
        <td class="${signalClass}">${analysis.verdict}${data.isSimulated ? ` \u00b7 ${text.simulatedPrefix}` : ""}</td>
        <td><button class="mini-action" type="button" data-analyze="${data.symbol}">${text.open}</button></td>
      </tr>
    `;
  }

  document.querySelectorAll("[data-symbol]").forEach(button => {
    button.addEventListener("click", () => {
      elements.input.value = button.dataset.symbol;
      analyze();
    });
  });

  document.querySelectorAll(".chart-mode").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".chart-mode").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      state.chartMode = button.dataset.mode;
      if (state.data) drawPriceChart(elements.priceChart, state.data, state.chartMode);
    });
  });

  $("#watchlist").addEventListener("click", event => {
    const load = event.target.dataset.load;
    const remove = event.target.dataset.remove;
    if (load) {
      elements.input.value = bareSymbol(load);
      analyze(load);
    }
    if (remove) {
      state.watchlist = state.watchlist.filter(item => item.symbol !== remove);
      saveWatchlist();
      renderWatchlist();
    }
  });

  $("#scannerBody").addEventListener("click", event => {
    const symbol = event.target.dataset.analyze || event.target.closest("tr")?.dataset.symbol;
    if (!symbol) return;
    elements.input.value = bareSymbol(symbol);
    analyze(symbol);
  });

  $("#guardRules").addEventListener("click", event => {
    const symbol = event.target.dataset.removeGuard;
    if (symbol) removeGuardRule(symbol);
  });

  $("#guardAlerts").addEventListener("click", event => {
    const index = event.target.dataset.removeAlert;
    if (index !== undefined) removeGuardAlert(Number(index));
  });

  elements.analyzeBtn.addEventListener("click", () => analyze());
  elements.input.addEventListener("keydown", event => { if (event.key === "Enter") analyze(); });
  elements.range.addEventListener("change", () => { if (elements.input.value.trim()) analyze(); });
  elements.cost.addEventListener("input", renderProfitLoss);
  elements.strategy.addEventListener("change", renderBacktest);
  $("#runBacktestBtn").addEventListener("click", renderBacktest);
  elements.watchBtn.addEventListener("click", toggleWatch);
  elements.scanBtn.addEventListener("click", scanMarket);
  elements.guardAddBtn.addEventListener("click", addGuardRule);
  elements.guardRunBtn.addEventListener("click", () => runGuardCheck());
  elements.notifyTestBtn.addEventListener("click", sendTestNotification);
  elements.clearAlertsBtn.addEventListener("click", clearGuardAlerts);
  elements.guardFrequency.addEventListener("change", configureGuardTimer);
  [elements.scannerMinScore, elements.scannerSignal, elements.scannerSort].forEach(control => {
    control.addEventListener("input", renderScannerRows);
    control.addEventListener("change", renderScannerRows);
  });
  window.addEventListener("resize", () => { if (state.data) renderAll(); });

  renderWatchlist();
  renderGuardPanel();
  configureGuardTimer();
  analyze();
})();
