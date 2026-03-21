import { useEffect, useState } from "react"
import { useTheme } from "@/hooks/use-theme"

interface HealthData {
  status?: string
  uptime_seconds?: number
  version?: string
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [ticks, setTicks] = useState<string[]>([])
  const [sseConnected, setSseConnected] = useState(false)

  // Fetch health check
  useEffect(() => {
    fetch("/api/v1/health")
      .then((r) => r.json())
      .then((data) => {
        setHealth(data)
        setHealthError(null)
      })
      .catch((e) => setHealthError(e.message))
  }, [])

  // SSE streaming example
  const connectSSE = () => {
    const es = new EventSource("/api/v1/stream/data/tick_stk")
    setSseConnected(true)
    es.onmessage = (event) => {
      setTicks((prev) => [event.data, ...prev].slice(0, 20))
    }
    es.onerror = () => {
      setSseConnected(false)
      es.close()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Dashboard link */}
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
                <span className={health.status === "ok" ? "text-green-500 font-medium" : "text-destructive"}>
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

        {/* API Examples */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-lg font-semibold">API Examples</h2>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              This demo shows how to call the Shioaji HTTP API from a custom app.
              Use <code className="rounded bg-muted px-1.5 py-0.5 text-xs">fetch()</code> for REST endpoints
              and <code className="rounded bg-muted px-1.5 py-0.5 text-xs">EventSource</code> for SSE streaming.
            </p>
            <div className="rounded-md bg-muted p-4 font-mono text-xs">
              <div className="text-muted-foreground">// Fetch market data snapshots</div>
              <div>{"fetch('/api/v1/data/snapshots', {"}</div>
              <div>{"  method: 'POST',"}</div>
              <div>{"  headers: { 'Content-Type': 'application/json' },"}</div>
              <div>{"  body: JSON.stringify({ contracts: [{ code: '2330' }] })"}</div>
              <div>{"}).then(r => r.json())"}</div>
            </div>
          </div>
        </div>

        {/* SSE Streaming */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="mb-4 text-lg font-semibold">SSE Streaming</h2>
          <div className="space-y-3">
            <button
              onClick={connectSSE}
              disabled={sseConnected}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sseConnected ? "Connected" : "Connect to Tick Stream"}
            </button>
            {ticks.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-md bg-muted p-3 font-mono text-xs">
                {ticks.map((tick, i) => (
                  <div key={i} className="border-b border-border py-1 last:border-0">
                    {tick}
                  </div>
                ))}
              </div>
            )}
            {sseConnected && ticks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Waiting for tick data... (subscribe to a contract first via the API)
              </p>
            )}
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
              <li>Upload the <code className="rounded bg-muted px-1.5 py-0.5 text-xs">dist/</code> folder to the server</li>
              <li>Access at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/apps/your-app-name/</code></li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
