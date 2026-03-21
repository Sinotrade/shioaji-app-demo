# Shioaji App Demo

A Vite + React + Tailwind CSS template for building custom apps on the [Shioaji](https://sinotrade.github.io/) API server.

## Quick Start

```bash
# Clone and install
git clone https://github.com/Sinotrade/shioaji-app-demo.git
cd shioaji-app-demo
pnpm install

# Dev mode (proxies /api to localhost:8080)
pnpm dev

# Build for production
pnpm build
```

## Deploy to Shioaji Server

Upload the built `dist/` folder to your running Shioaji server:

```bash
pnpm build

# Upload files from dist/
cd dist
curl -X POST http://localhost:8080/api/v1/apps/demo \
  -F "files=@index.html;filename=index.html" \
  -F "files=@assets/$(ls assets/*.js);filename=assets/$(ls assets/*.js)" \
  -F "files=@assets/$(ls assets/*.css);filename=assets/$(ls assets/*.css)"

# Access at http://localhost:8080/apps/demo/
```

## Customize

1. **App name**: Change `base` in `vite.config.ts` to `/apps/your-app-name/`
2. **Theme**: Shares light/dark theme with the Shioaji dashboard via `localStorage`
3. **API calls**: Use `fetch('/api/v1/...')` — see `src/App.tsx` for examples
4. **Streaming**: Use `EventSource('/api/v1/stream/data/tick_stk')` for real-time data

## Stack

- React 19, Tailwind CSS 4, Vite 8, TypeScript
- Geist font (matching Shioaji dashboard)
- Same theme system as the dashboard (light/dark via `localStorage`)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Server health check |
| `/api/v1/data/snapshots` | POST | Market data snapshots |
| `/api/v1/data/kbars` | POST | KBar data |
| `/api/v1/stream/data/tick_stk` | GET (SSE) | Real-time stock ticks |
| `/api/v1/stream/subscribe` | POST | Subscribe to market data |
| `/docs` | GET | Full API documentation |

See the full API reference at `http://localhost:8080/docs`.
