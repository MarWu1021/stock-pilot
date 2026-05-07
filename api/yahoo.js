const ALLOWED_RANGES = new Set(["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y"]);
const ALLOWED_INTERVALS = new Set(["1m", "5m", "15m", "1d", "1wk", "1mo"]);

function sendJson(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const symbol = String(req.query.symbol || "").trim().toUpperCase();
  const range = ALLOWED_RANGES.has(req.query.range) ? req.query.range : "1y";
  const interval = ALLOWED_INTERVALS.has(req.query.interval) ? req.query.interval : "1d";

  if (!/^[A-Z0-9.^-]{1,18}(\.TW|\.TWO)?$/.test(symbol)) {
    sendJson(res, 400, { error: "Invalid symbol" });
    return;
  }

  const url = new URL(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);
  url.searchParams.set("includeAdjustedClose", "true");

  try {
    const yahooResponse = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 StockPilot/1.0"
      }
    });

    const payload = await yahooResponse.json();
    if (!yahooResponse.ok) {
      sendJson(res, yahooResponse.status, payload);
      return;
    }

    const cacheHeader = interval === "1m" || interval === "5m"
      ? "s-maxage=15, stale-while-revalidate=30"
      : "s-maxage=60, stale-while-revalidate=300";
    res.setHeader("Cache-Control", cacheHeader);
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, 502, { error: "Yahoo request failed", details: error.message });
  }
}
