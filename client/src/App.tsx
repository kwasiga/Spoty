import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { getSession } from "./lib/api"
import Onboarding from "./pages/Onboarding"
import Dashboard from "./pages/Dashboard"

type SessionUser = { id: string; name: string; image: string | null }

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
  )
}
