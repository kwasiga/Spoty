import { useEffect, useState } from "react"
import { getStats, getNowPlaying, logout, updateMe, deleteMe } from "../lib/api"
import FeedClient from "../components/FeedClient"

interface SessionUser {
  id: string
  name: string
  image: string | null
}

interface Stats {
  lastPlayed: { name: string; artist: string; album_art?: string; url: string } | null
  top10: { id: string; name: string; artist: string; album: string; album_art?: string; url: string; duration_ms: number }[]
  hoursListened: number
  topArtist: { name: string; image?: string; url: string; genres: string[] } | null
}

interface NowPlaying {
  is_playing: boolean
  track?: { id: string; name: string; artist: string; album: string; album_art?: string; url: string }
}

function fmt(ms: number) {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function Dashboard({
  user,
  setUser,
}: {
  user: SessionUser
  setUser: (u: SessionUser | null) => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editName, setEditName] = useState(user.name)
  const [nameError, setNameError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
    getNowPlaying().then(setNowPlaying).catch(console.error)
  }, [])

  async function handleLogout() {
    await logout()
    setUser(null)
  }

  async function handleSaveName() {
    if (!editName.trim()) { setNameError("Name cannot be empty"); return }
    setSaving(true)
    setNameError("")
    try {
      const { user: updated } = await updateMe(editName.trim())
      setUser(updated)
      setProfileOpen(false)
    } catch (err: unknown) {
      setNameError((err as Error).message ?? "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Delete your account? This cannot be undone.")) return
    setDeleting(true)
    try {
      await deleteMe()
      setUser(null)
    } finally {
      setDeleting(false)
    }
  }

  const currentTrack = nowPlaying?.is_playing ? nowPlaying.track : null
  const firstName = (user.name ?? "").split(" ")[0]

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">

      {/* header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-6">
          <span className="text-base font-bold tracking-tighter text-white">spoty</span>
          <nav className="hidden sm:flex items-center gap-1">
            {["Dashboard"].map((tab) => (
              <span
                key={tab}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-default ${
                  tab === "Dashboard"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </span>
            ))}
          </nav>
        </div>
        <button
          onClick={() => { setEditName(user.name); setNameError(""); setProfileOpen(true) }}
          className="flex items-center gap-2 hover:opacity-75 transition"
        >
          {user.image
            ? <img src={user.image} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
            : <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">{(user.name ?? "?")[0]}</div>
          }
        </button>
      </header>

      <main className="flex-1 flex flex-col gap-5 px-6 py-6 max-w-7xl w-full mx-auto">

        {/* welcome + now playing */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-zinc-500 text-sm mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {firstName}{" "}
              <span className="text-zinc-500 font-normal">{user.name.slice(firstName.length)}</span>
            </h1>
          </div>

          {/* now playing pill */}
          {currentTrack ? (
            <a
              href={currentTrack.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/5 px-4 py-3 hover:border-[#1DB954]/60 transition max-w-xs"
            >
              {currentTrack.album_art && (
                <img src={currentTrack.album_art} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse flex-shrink-0" />
                  <span className="text-[10px] text-[#1DB954] font-semibold uppercase tracking-widest">now playing</span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{currentTrack.name}</p>
                <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
            </a>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-600">
              nothing playing right now
            </div>
          )}
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hours listened*", value: stats ? (stats.hoursListened > 0 ? `${stats.hoursListened}h` : "—") : "…", note: "*last 50 plays" },
            { label: "Top genre", value: stats?.topArtist?.genres?.[0] ?? (stats ? "—" : "…"), note: stats?.topArtist?.name ?? "" },
            { label: "Last played", value: stats?.lastPlayed?.name ?? (stats ? "—" : "…"), note: stats?.lastPlayed?.artist ?? "" },
          ].map(({ label, value, note }) => (
            <div key={label} className="rounded-2xl border border-white/5 bg-zinc-900/60 px-4 py-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
              <p className="text-lg font-bold text-white truncate">{value}</p>
              {note && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{note}</p>}
            </div>
          ))}
        </div>

        {/* bottom 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">

          {/* top 10 tracks */}
          <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Top 10 tracks</h2>
              <span className="text-[10px] text-zinc-600">this month</span>
            </div>
            <div className="flex flex-col gap-0.5 overflow-y-auto">
              {!stats && <p className="text-zinc-600 text-xs">loading…</p>}
              {stats?.top10.length === 0 && (
                <p className="text-zinc-600 text-xs">no data yet — listen more on Spotify.</p>
              )}
              {stats?.top10.map((t, i) => (
                <a
                  key={t.id}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition group"
                >
                  <span className="w-4 text-right text-[10px] text-zinc-600 flex-shrink-0">{i + 1}</span>
                  {t.album_art && (
                    <img src={t.album_art} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate group-hover:text-[#1DB954] transition">{t.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{t.artist}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 flex-shrink-0">{fmt(t.duration_ms)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* top artist */}
          <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Top artist</h2>
              <span className="text-[10px] text-zinc-600">this month</span>
            </div>

            {!stats && <p className="text-zinc-600 text-xs">loading…</p>}
            {stats && !stats.topArtist && (
              <p className="text-zinc-600 text-xs">no data yet.</p>
            )}
            {stats?.topArtist && (
              <a
                href={stats.topArtist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-4 flex-1 justify-center hover:opacity-80 transition"
              >
                {stats.topArtist.image && (
                  <img
                    src={stats.topArtist.image}
                    alt=""
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-white/5"
                  />
                )}
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{stats.topArtist.name}</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {(stats.topArtist.genres ?? []).map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 capitalize"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            )}
          </div>

          {/* friends live feed */}
          <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 flex flex-col gap-3 min-h-0">
            <FeedClient userId={user.id} />
          </div>

        </div>
      </main>

      {/* profile modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl bg-zinc-900 border border-white/10 p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {user.image
                ? <img src={user.image} alt="" className="w-12 h-12 rounded-full" />
                : <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold">{user.name[0]}</div>
              }
              <div className="min-w-0">
                <p className="font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{user.id}</p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Display name</label>
              <input
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setNameError("") }}
                className="rounded-xl bg-zinc-800 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1DB954]"
              />
              {nameError && <p className="text-xs text-red-400">{nameError}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveName}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:bg-[#1ed760] transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setProfileOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>

            <div className="flex gap-2 border-t border-white/5 pt-4">
              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
              >
                Log out
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 rounded-xl border border-red-900/50 px-4 py-2 text-sm text-red-500 hover:bg-red-950/40 transition disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
