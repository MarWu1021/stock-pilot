(() => {
  const $ = selector => document.querySelector(selector);
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  const pct = value => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;

  const names = {
    "2330": "TSMC Taiwan", "2317": "Hon Hai", "2454": "MediaTek", "2303": "UMC", "2308": "Delta Electronics",
    "2412": "Chunghwa Telecom", "2382": "Quanta", "2357": "ASUS", "2881": "Fubon Financial", "2882": "Cathay Financial",
    "0050": "Yuanta Taiwan 50", "0056": "Yuanta High Dividend", "00878": "Cathay Sustainable High Dividend", "006208": "Fubon Taiwan 50",
    "00919": "Capital Taiwan Select High Dividend", "AAPL": "Apple", "MSFT": "Microsoft", "NVDA": "NVIDIA", "TSLA": "Tesla"
  };

  const popularSymbols = ["2330", "2317", "2454", "2303", "2308", "2382", "0050", "0056", "00878", "006208"];
  const state = {
    data: null,
    analysis: null,
    chartMode: "line",
    scannerRows: [],
    watchlist: JSON.parse(localStorage.getItem("stockPilotWatchlist") || "[]")
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
    scannerSort: $("#scannerSort")
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

  async function fetchStockData(symbol) {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${elements.range.value}&interval=1d&includeAdjustedClose=true`;
    const json = await fetchJson(url);
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

  function buildData(symbol, rows) {
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
      changePct: current / previous - 1
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
    return buildData(symbol, rows);
  }

  async function analyze(symbol = normalizeSymbol(elements.input.value)) {
    if (!symbol) {
      elements.input.focus();
      return;
    }

    elements.analyzeBtn.disabled = true;
    showStatus(`Loading price data for ${symbol}...`);

    try {
      let data;
      try {
        data = await fetchStockData(symbol);
        hideStatus();
      } catch {
        data = makeFallbackData(symbol);
        showStatus(`Live data is blocked or unavailable. Using local simulated data for ${symbol}.`);
      }

      state.data = data;
      state.analysis = StockStrategy.scoreData(data);
      elements.input.value = bareSymbol(symbol);
      elements.result.classList.remove("hidden");
      renderAll();
      elements.result.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showStatus(error.message || "Analysis failed. Please check the symbol.", true);
    } finally {
      elements.analyzeBtn.disabled = false;
    }
  }

  function renderAll() {
    renderSummary();
    drawPriceChart(elements.priceChart, state.data, state.chartMode);
    renderFactors();
    renderTargets();
    renderBacktest();
    renderWatchlist();
  }

  function renderSummary() {
    const data = state.data;
    const analysis = state.analysis;
    $("#stockName").textContent = data.name;
    $("#stockSymbol").textContent = data.symbol;
    $("#currentPrice").textContent = `${data.currency}${fmt.format(data.currentPrice)}`;
    const change = $("#priceChange");
    change.textContent = `${data.change >= 0 ? "+" : ""}${fmt.format(data.change)} (${pct(data.changePct)})`;
    change.className = data.change > 0 ? "up" : data.change < 0 ? "down" : "flat";

    const card = $("#verdictCard");
    card.className = `verdict-card ${analysis.tone}`;
    $("#verdictText").textContent = analysis.verdict;
    $("#confidenceText").textContent = `Confidence ${analysis.confidence.toFixed(0)} / Score ${analysis.score.toFixed(0)}`;
    $("#confidenceMeter").style.width = `${analysis.score.toFixed(0)}%`;
    $("#verdictReason").textContent = analysis.reason;

    const regime = $("#regimeBadge");
    const vol = analysis.indicators.volatility;
    regime.textContent = vol > 0.45 ? "High volatility" : analysis.score > 65 ? "Bull structure" : analysis.score < 42 ? "Weak structure" : "Range watch";
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
    const money = value => `${data.currency}${fmt.format(value)}`;
    const rr = $("#riskRewardBadge");
    rr.textContent = `R/R ${targets.riskReward.toFixed(2)}`;
    rr.className = `pill ${targets.riskReward >= 1.6 ? "good" : targets.riskReward >= 1 ? "warn" : "bad"}`;
    $("#targetTable").innerHTML = `
      <tr><td>Target 1</td><td><strong>${money(targets.target1)}</strong></td><td>About ${pct(targets.target1 / data.currentPrice - 1)}</td></tr>
      <tr><td>Target 2</td><td><strong>${money(targets.target2)}</strong></td><td>Momentum extension</td></tr>
      <tr><td>Stop reference</td><td><strong>${money(targets.stopLoss)}</strong></td><td>${pct(targets.stopLoss / data.currentPrice - 1)}</td></tr>
      <tr><td>Support / resistance</td><td><strong>${money(targets.support)} - ${money(targets.resistance)}</strong></td><td>ATR and Bollinger estimate</td></tr>
      <tr><td>1-month scenario</td><td><strong>${money(targets.monthLow)} - ${money(targets.monthHigh)}</strong></td><td>Short-term range</td></tr>
      <tr><td>6-month scenario</td><td><strong>${money(targets.halfYearLow)} - ${money(targets.halfYearHigh)}</strong></td><td>Volatility projection</td></tr>
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
    box.innerHTML = `Cost basis ${data.currency}${fmt.format(cost)}: current P/L <strong class="${now >= 0 ? "up" : "down"}">${pct(now)}</strong>, target 1 P/L <strong class="${tp >= 0 ? "up" : "down"}">${pct(tp)}</strong>, stop P/L <strong class="${sl >= 0 ? "up" : "down"}">${pct(sl)}</strong>.`;
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
    const items = [["Price", "#22d3ee"], ["MA20", "#f59e0b"], ["MA60", "#8b5cf6"]];
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
      ["Total return", pct(result.metrics.totalReturn), result.metrics.totalReturn >= 0 ? "up" : "down"],
      ["CAGR", pct(result.metrics.cagr), result.metrics.cagr >= 0 ? "up" : "down"],
      ["Win rate", `${(result.metrics.winRate * 100).toFixed(1)}%`, ""],
      ["Max drawdown", pct(result.metrics.maxDrawdown), "down"],
      ["Trades", result.metrics.tradeCount, ""]
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
    elements.watchBtn.textContent = exists ? "Remove" : "Add";
    const wrap = $("#watchlist");
    if (!state.watchlist.length) {
      wrap.innerHTML = `<p class="muted">No watchlist symbols yet. Analyze a symbol, then add it here.</p>`;
      return;
    }
    wrap.innerHTML = state.watchlist.map(item => `
      <div class="watch-item">
        <strong>${item.name}</strong>
        <button type="button" data-load="${item.symbol}">${bareSymbol(item.symbol)}</button>
        <button type="button" data-remove="${item.symbol}">Remove</button>
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

  async function scanMarket() {
    elements.scanBtn.disabled = true;
    const body = $("#scannerBody");
    body.innerHTML = `<tr><td colspan="8">Scanning...</td></tr>`;
    const rows = [];
    const symbols = parseScannerSymbols();
    if (!symbols.length) {
      body.innerHTML = `<tr><td colspan="8">Add at least one symbol to scan.</td></tr>`;
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
      : `<tr><td colspan="8">No symbols match the current filters.</td></tr>`;
  }

  function scannerRow(row) {
    const data = row.data;
    const analysis = row.analysis;
    const signalClass = analysis.tone === "bull" ? "up" : analysis.tone === "bear" ? "down" : "flat";
    return `
      <tr data-symbol="${data.symbol}">
        <td><strong>${bareSymbol(data.symbol)}</strong></td>
        <td>${data.name}</td>
        <td>${data.currency}${fmt.format(data.currentPrice)}</td>
        <td class="${data.changePct >= 0 ? "up" : "down"}">${pct(data.changePct)}</td>
        <td>${analysis.score.toFixed(0)}</td>
        <td>${analysis.targets.riskReward.toFixed(2)}</td>
        <td class="${signalClass}">${analysis.verdict}</td>
        <td><button class="mini-action" type="button" data-analyze="${data.symbol}">Open</button></td>
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

  elements.analyzeBtn.addEventListener("click", () => analyze());
  elements.input.addEventListener("keydown", event => { if (event.key === "Enter") analyze(); });
  elements.range.addEventListener("change", () => { if (elements.input.value.trim()) analyze(); });
  elements.cost.addEventListener("input", renderProfitLoss);
  elements.strategy.addEventListener("change", renderBacktest);
  $("#runBacktestBtn").addEventListener("click", renderBacktest);
  elements.watchBtn.addEventListener("click", toggleWatch);
  elements.scanBtn.addEventListener("click", scanMarket);
  [elements.scannerMinScore, elements.scannerSignal, elements.scannerSort].forEach(control => {
    control.addEventListener("input", renderScannerRows);
    control.addEventListener("change", renderScannerRows);
  });
  window.addEventListener("resize", () => { if (state.data) renderAll(); });

  renderWatchlist();
  analyze();
})();
