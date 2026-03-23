import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/hooks/use-theme"

interface HealthData {
  status?: string
  uptime_seconds?: number
  version?: string
}

interface TickData {
  code: string
  date: string
  time: string
  close: number
  volume: number
  tick_type: number
}

function parseTick(data: string): TickData | null {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  // Subscribe
  const [subCode, setSubCode] = useState("2330")
  const [subStatus, setSubStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [subscribing, setSubscribing] = useState(false)

  // Streaming
  const [ticks, setTicks] = useState<TickData[]>([])
  const [sseConnected, setSseConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    fetch("/api/v1/health")
      .then((r) => r.json())
      .then((data) => { setHealth(data); setHealthError(null) })
      .catch((e) => setHealthError(e.message))
  }, [])

  const handleSubscribe = async () => {
    if (!subCode.trim()) return
    setSubscribing(true)
    setSubStatus(null)
    try {
      const res = await fetch("/api/v1/stream/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          security_type: "STK",
          exchange: "TSE",
          code: subCode.trim(),
          quote_type: "Tick",
        }),
      })
      if (res.ok) {
        setSubStatus({ type: "success", message: `Subscribed to ${subCode.trim()}` })
      } else {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        setSubStatus({ type: "error", message: err.message || res.statusText })
      }
    } catch (e) {
      setSubStatus({ type: "error", message: String(e) })
    } finally {
      setSubscribing(false)
    }
  }

  const connectSSE = () => {
    if (esRef.current) { esRef.current.close() }
    const es = new EventSource("/api/v1/stream/data/tick_stk")
    esRef.current = es
    setSseConnected(true)
    setTicks([])
    // Named SSE events (event:tick_stk) need addEventListener, not onmessage
    es.addEventListener("tick_stk", (event) => {
      const tick = parseTick((event as MessageEvent).data)
      if (tick) setTicks((prev) => [tick, ...prev].slice(0, 10))
    })
    es.onerror = () => { setSseConnected(false); es.close(); esRef.current = null }
  }

  const disconnectSSE = () => {
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    setSseConnected(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Dashboard
            </a>
            <span className="text-border">|</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-sm font-semibold">Demo App</span>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-6 px-6 py-8">
        {/* Health Check */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-lg font-semibold">Health Check</h2>
          {healthError ? (
            <p className="text-sm text-destructive">Error: {healthError}</p>
          ) : health ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={health.status === "healthy" ? "text-green-500 font-medium" : "text-destructive"}>
                  {health.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span>{health.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span>{health.uptime_seconds ? `${Math.floor(health.uptime_seconds)}s` : "—"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </div>

        {/* Subscribe + Stream */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-lg font-semibold">Market Data Streaming</h2>
          <div className="flex gap-6">
            {/* Left: Controls */}
            <div className="shrink-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                Subscribe to a stock code to receive<br />real-time tick data via SSE.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Stock code"
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  className="h-9 w-24 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {subscribing ? "..." : "Subscribe"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {!sseConnected ? (
                  <button
                    onClick={connectSSE}
                    className="h-9 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Connect Stream
                  </button>
                ) : (
                  <button
                    onClick={disconnectSSE}
                    className="h-9 rounded-md border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Disconnect
                  </button>
                )}
                {sseConnected && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-500">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {subStatus && (
                <p className={`text-xs ${subStatus.type === "error" ? "text-destructive" : "text-green-500"}`}>
                  {subStatus.message}
                </p>
              )}
            </div>

            {/* Right: Tick Table (always 10 rows) */}
            <div className="min-w-0 flex-1 rounded-md border">
              <div className="grid grid-cols-5 gap-2 border-b bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Code</span>
                <span>Time</span>
                <span className="text-right">Price</span>
                <span className="text-right">Volume</span>
                <span className="text-right">Type</span>
              </div>
              {Array.from({ length: 10 }).map((_, i) => {
                const tick = ticks[i]
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-5 gap-2 border-b px-3 py-1.5 text-xs last:border-0 ${
                      tick && i === 0 ? "bg-accent/50" : ""
                    }`}
                  >
                    {tick ? (
                      <>
                        <span className="font-medium">{tick.code}</span>
                        <span className="text-muted-foreground">
                          {tick.time || "—"}
                        </span>
                        <span className={`text-right font-mono ${
                          tick.tick_type === 1 ? "text-red-500" : tick.tick_type === 2 ? "text-green-500" : ""
                        }`}>
                          {tick.close || "—"}
                        </span>
                        <span className="text-right font-mono">{tick.volume || "—"}</span>
                        <span className="text-right">
                          {tick.tick_type === 1 ? "Buy" : tick.tick_type === 2 ? "Sell" : "—"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground/30">—</span>
                        <span className="text-muted-foreground/30">—</span>
                        <span className="text-right text-muted-foreground/30">—</span>
                        <span className="text-right text-muted-foreground/30">—</span>
                        <span className="text-right text-muted-foreground/30">—</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* API Examples */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-lg font-semibold">API Examples</h2>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Use <code className="rounded bg-muted px-1.5 py-0.5 text-xs">fetch()</code> for REST endpoints
              and <code className="rounded bg-muted px-1.5 py-0.5 text-xs">EventSource</code> for SSE streaming.
            </p>
            <div className="rounded-md bg-muted p-4 font-mono text-xs space-y-4">
              <div>
                <div className="text-muted-foreground mb-1">// Subscribe to market data</div>
                <div>{"fetch('/api/v1/stream/subscribe', {"}</div>
                <div>{"  method: 'POST',"}</div>
                <div>{"  headers: { 'Content-Type': 'application/json' },"}</div>
                <div>{"  body: JSON.stringify({"}</div>
                <div>{"    security_type: 'STK', exchange: 'TSE',"}</div>
                <div>{"    code: '2330', quote_type: 'Tick'"}</div>
                <div>{"  })"}</div>
                <div>{"})"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">// Connect to SSE tick stream</div>
                <div>{"const es = new EventSource('/api/v1/stream/data/tick_stk')"}</div>
                <div>{"es.onmessage = (e) => console.log(JSON.parse(e.data))"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">// Fetch market data snapshots</div>
                <div>{"fetch('/api/v1/data/snapshots', {"}</div>
                <div>{"  method: 'POST',"}</div>
                <div>{"  headers: { 'Content-Type': 'application/json' },"}</div>
                <div>{"  body: JSON.stringify({ contracts: [{ code: '2330' }] })"}</div>
                <div>{"}).then(r => r.json())"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-lg font-semibold">Build Your Own App</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>This is a template for building custom apps on the Shioaji API server.</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Clone this repo and customize the components</li>
              <li>Set <code className="rounded bg-muted px-1.5 py-0.5 text-xs">base</code> in <code className="rounded bg-muted px-1.5 py-0.5 text-xs">vite.config.ts</code> to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/apps/your-app-name/</code></li>
              <li>Run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">pnpm build</code></li>
              <li>Upload via the Dashboard's Custom Apps card or curl</li>
              <li>Access at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/apps/your-app-name/</code></li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
