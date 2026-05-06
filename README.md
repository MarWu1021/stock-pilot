# Stock Pilot

A browser-based stock research dashboard for Taiwan stocks, ETFs, and US symbols.

## Features

- Technical score from trend, momentum, RSI, MACD, volume, volatility, and Bollinger position
- Price scenarios with stop reference and risk/reward ratio
- Custom market scanner with filters and sorting
- Watchlist saved in the browser
- Simple strategy backtests
- Optional Yahoo Finance backend proxy for Vercel-style deployments

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 4173
```

## Deploy notes

GitHub Pages can host the static app. Because GitHub Pages cannot run backend code, the app will use direct browser data access and fallback simulated data when blocked.

For more stable Yahoo Finance requests, deploy this project on a platform that supports serverless functions, such as Vercel. The app will then use `/api/yahoo` first and fall back only if needed.

Research only. Not financial advice.
