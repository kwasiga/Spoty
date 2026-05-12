import { useEffect, useState, Component, ReactNode } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getSession } from "./lib/api"
import Onboarding from "./pages/Onboarding"
import Dashboard from "./pages/Dashboard"

type SessionUser = { id: string; name: string; image: string | null }

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
          <div className="rounded-2xl border border-red-900/50 bg-zinc-950 p-6 max-w-md w-full">
            <p className="text-red-400 text-sm font-mono">{this.state.error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-xs text-zinc-500 hover:text-white transition">
              reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined)

  useEffect(() => {
    getSession()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
  }, [])

  if (user === undefined) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route
          path="/onboarding"
          element={user ? <Navigate to="/dashboard" replace /> : <Onboarding />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/onboarding" replace />}
        />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/onboarding"} replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
