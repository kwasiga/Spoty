import { useEffect, useState } from "react"
import { getStats, getNowPlaying, logout } from "../lib/api"
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

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-4">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-lg font-bold text-white truncate">{value}</p>
      {note && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{note}</p>}
    </div>
  )
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

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
    getNowPlaying().then(setNowPlaying).catch(console.error)
  }, [])

  async function handleLogout() {
    await logout()
    setUser(null)
  }

  const currentTrack = nowPlaying?.is_playing ? nowPlaying.track : null

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <span className="text-lg font-bold tracking-tighter">spoty</span>
        <div className="flex items-center gap-3">
          {user.image && (
            <img src={user.image} alt="" className="w-7 h-7 rounded-full" />
          )}
          <span className="text-sm text-zinc-400">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition"
          >
            logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-10">

        {/* currently playing */}
        {currentTrack ? (
          <a
            href={currentTrack.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-[#1DB954]/40 bg-[#1DB954]/5 px-5 py-4 hover:border-[#1DB954]/70 transition"
          >
            {currentTrack.album_art && (
              <img src={currentTrack.album_art} alt="" className="w-14 h-14 rounded-xl flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1 text-[10px] text-[#1DB954] font-semibold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                  now playing
                </span>
              </div>
              <p className="font-bold text-white truncate">{currentTrack.name}</p>
              <p className="text-sm text-zinc-400 truncate">{currentTrack.artist}</p>
            </div>
          </a>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-600">
            nothing playing right now
          </div>
        )}

        {/* stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="hours this month*"
            value={stats ? (stats.hoursListened > 0 ? `${stats.hoursListened}h` : "—") : "…"}
            note="*last 50 plays"
          />
          <StatCard
            label="top artist"
            value={stats?.topArtist?.name ?? (stats ? "—" : "…")}
            note={stats?.topArtist?.genres?.[0] ?? ""}
          />
          <StatCard
            label="last played"
            value={stats?.lastPlayed?.name ?? (stats ? "—" : "…")}
            note={stats?.lastPlayed?.artist ?? ""}
          />
        </div>

        {/* top 10 */}
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">top 10 tracks</h2>
          <div className="flex flex-col gap-0.5">
            {!stats && <p className="text-zinc-600 text-sm">loading…</p>}
            {stats?.top10.length === 0 && (
              <p className="text-zinc-600 text-sm">no data yet — listen more on Spotify first.</p>
            )}
            {stats?.top10.map((t, i) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-900 transition group"
              >
                <span className="w-5 text-right text-xs text-zinc-600 flex-shrink-0">{i + 1}</span>
                {t.album_art && (
                  <img src={t.album_art} alt="" className="w-9 h-9 rounded flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate group-hover:text-[#1DB954] transition">{t.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{t.artist}</p>
                </div>
                <span className="text-xs text-zinc-600 flex-shrink-0">{fmt(t.duration_ms)}</span>
              </a>
            ))}
          </div>
        </section>

        {/* live feed + friends */}
        <FeedClient userId={user.id} />
      </div>
    </div>
  )
}
