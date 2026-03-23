# Shioaji App Demo

A Vite + React + Tailwind CSS template for building custom apps on the [Shioaji](https://sinotrade.github.io/) API server.

## Features

- **Health Check** — server status, version, uptime
- **Market Data Streaming** — subscribe to stocks, real-time tick table with microsecond timestamps
- **Side-by-side layout** — controls on left, 10-row tick table on right (empty rows shown as placeholders)
- **Theme sync** — shares light/dark theme with the Shioaji dashboard
- **Dashboard navigation** — "← Dashboard" link for seamless switching

## Quick Start

```bash
git clone https://github.com/Sinotrade/shioaji-app-demo.git
cd shioaji-app-demo
pnpm install

# Dev mode (proxies /api to localhost:8080)
pnpm dev

# Build for production
pnpm build
```

## Deploy to Shioaji Server

### Option 1: Dashboard UI (recommended)

1. `pnpm build`
2. Open the Shioaji Dashboard at `http://localhost:8080`
3. Scroll to the **Custom Apps** card
4. Enter an app name (e.g. `demo`)
5. Select "Folder" mode, choose the `dist/` folder
6. Click **Upload**
7. Access at `http://localhost:8080/apps/demo/`

### Option 2: curl

```bash
pnpm build
cd dist
curl -X POST http://localhost:8080/api/v1/apps/demo \
  -F "files=@index.html;filename=index.html" \
  -F "files=@assets/$(ls assets/*.js);filename=assets/$(ls assets/*.js)" \
  -F "files=@assets/$(ls assets/*.css);filename=assets/$(ls assets/*.css)"
```

## Dashboard Integration

Custom apps run alongside the Shioaji Dashboard and share the same server.

### Theme Sync

Apps share the dashboard's light/dark theme via `localStorage`. The `use-theme.ts` hook reads `localStorage.getItem("theme")` and applies the `.dark` CSS class. When a user toggles theme in either the dashboard or your app, both reflect the change.

### Navigation

- Apps include a **"← Dashboard"** link in the header pointing to `/`
- The dashboard's **Custom Apps** card lists all installed apps with Open/Delete buttons
- Users navigate seamlessly between dashboard and apps

### Vite Base Path

Apps are served at `/apps/<name>/`. Set `base` in `vite.config.ts` to match:

```ts
export default defineConfig({
  base: "/apps/your-app-name/",
  // ...
})
```

### API Proxy (Dev Mode)

In development, Vite proxies `/api` requests to `http://localhost:8080`:

```ts
server: {
  proxy: {
    "/api": "http://localhost:8080",
  },
},
```

### CSS Theme Variables

The CSS uses the same oklch color variables as the dashboard. Copy `src/index.css` as your starting point — it includes all `:root` and `.dark` variables.

### SSE Streaming

SSE events use **named event types** (e.g. `event:tick_stk`). Use `addEventListener` instead of `onmessage`:

```ts
const es = new EventSource("/api/v1/stream/data/tick_stk")

// Named events require addEventListener (onmessage won't work)
es.addEventListener("tick_stk", (event) => {
  const tick = JSON.parse(event.data)
  // tick: { code, date, time, close, volume, tick_type, ... }
})
```

Subscribe before connecting:

```ts
await fetch("/api/v1/stream/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    security_type: "STK",
    exchange: "TSE",
    code: "2330",
    quote_type: "Tick",
  }),
})
```

## Customize

1. **App name**: Change `base` in `vite.config.ts` to `/apps/your-app-name/`
2. **Theme**: Already synced with dashboard via `localStorage`
3. **REST API**: Use `fetch('/api/v1/...')` — see `src/App.tsx` for examples
4. **Streaming**: Subscribe with `POST /api/v1/stream/subscribe`, connect with `EventSource`, listen with `addEventListener`
5. **Components**: Add shadcn components with `npx shadcn add <component>`

## Stack

- React 19, Tailwind CSS 4, Vite 8, TypeScript
- Geist font (matching Shioaji dashboard)
- Same theme system as the dashboard (light/dark via `localStorage`)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Server health check |
| `/api/v1/stream/subscribe` | POST | Subscribe to market data |
| `/api/v1/stream/unsubscribe` | POST | Unsubscribe from market data |
| `/api/v1/stream/data/tick_stk` | GET (SSE) | Real-time stock tick stream |
| `/api/v1/stream/data/bidask_stk` | GET (SSE) | Real-time stock bid/ask stream |
| `/api/v1/stream/data/tick_fop` | GET (SSE) | Real-time futures/options tick stream |
| `/api/v1/data/snapshots` | POST | Market data snapshots |
| `/api/v1/data/kbars` | POST | KBar (candlestick) data |
| `/api/v1/data/ticks` | POST | Historical tick data |
| `/api/v1/order/place_order` | POST | Place stock/futures order |
| `/api/v1/portfolio/account_balance` | POST | Account balance |
| `/api/v1/portfolio/position_unit` | POST | Current positions |
| `/api/v1/apps` | GET | List installed apps |
| `/docs` | GET | Full API documentation (Scalar UI) |

See the full API reference at `http://localhost:8080/docs`.
