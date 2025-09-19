import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"
import "flag-icons/css/flag-icons.min.css"
import { stopPerformanceLogging } from "./lib/performance"

// Simple error boundary so crashes render instead of blank screen
class Boundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { err: null }
  }
  componentDidCatch(err: Error) {
    this.setState({ err })
    console.error("💥 App crashed:", err)
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h1>💥 App crashed</h1>
          <p>See DevTools console for details.</p>
          <pre>{this.state.err.stack || this.state.err.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

// Helpful: log which env source is present (not values)
const hasImportMeta = !!import.meta.env.VITE_SUPABASE_URL && (!!import.meta.env.VITE_SUPABASE_ANON_KEY || !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
const hasWindowEnv =
  typeof window !== 'undefined' &&
  !!(window as any).__ENV__?.VITE_SUPABASE_URL &&
  (!!(window as any).__ENV__?.VITE_SUPABASE_ANON_KEY || !!(window as any).__ENV__?.VITE_SUPABASE_PUBLISHABLE_KEY)
console.info('[env] import.meta.env:', hasImportMeta, 'window.__ENV__:', hasWindowEnv)

const rootEl = document.getElementById("root")
if (!rootEl) {
  const el = document.createElement("div")
  el.style.cssText = "padding:16px;font-family:monospace"
  el.textContent = "❌ Missing <div id='root'></div> in index.html"
  document.body.appendChild(el)
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <Boundary>
        <App />
      </Boundary>
    </React.StrictMode>
  )
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopPerformanceLogging()
  })
}
