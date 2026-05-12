import { useEffect, useRef, useState } from "react"
import Pusher from "pusher-js"
import { getFriends, followFriend, broadcast } from "../lib/api"

interface Track {
  id: string
  name: string
  artist: string
  album: string
  album_art?: string
  url: string
}

interface NowPlayingEvent {
  is_playing: boolean
  userId: string
  userName: string
  userImage: string
  track?: Track
}

interface Friend {
  id: string
  name: string
  image: string | null
}

export default function FeedClient({ userId }: { userId: string }) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [feed, setFeed] = useState<Record<string, NowPlayingEvent>>({})
  const [addInput, setAddInput] = useState("")
  const [addError, setAddError] = useState("")
  const [copied, setCopied] = useState(false)
  const pusherRef = useRef<Pusher | null>(null)

  useEffect(() => {
    getFriends().then(setFriends).catch(console.error)

    const key = import.meta.env.VITE_PUSHER_KEY as string
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER as string
    pusherRef.current = new Pusher(key, { cluster })
    const channel = pusherRef.current.subscribe(`user-${userId}`)
    channel.bind("now-playing", (data: NowPlayingEvent) => {
      setFeed((prev) => ({ ...prev, [data.userId]: data }))
    })

    broadcast().catch(console.error)
    const interval = setInterval(() => broadcast().catch(console.error), 30_000)

    return () => {
      clearInterval(interval)
      pusherRef.current?.unsubscribe(`user-${userId}`)
      pusherRef.current?.disconnect()
    }
  }, [userId])

  async function addFriend() {
    const id = addInput.trim()
    if (!id) return
    setAddError("")
    try {
      await followFriend(id)
      setAddInput("")
      const updated = await getFriends()
      setFriends(updated)
    } catch (err: unknown) {
      setAddError((err as Error).message ?? "Something went wrong")
    }
  }

  function copyId() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const feedEntries = Object.values(feed).filter((e) => e.is_playing)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">add friend</h2>
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2">
          <span className="text-xs text-zinc-500 flex-shrink-0">Your ID</span>
          <span className="flex-1 truncate font-mono text-xs text-zinc-300">{userId}</span>
          <button onClick={copyId} className="text-xs text-[#1DB954] hover:text-[#1ed760] transition flex-shrink-0">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={addInput}
            onChange={(e) => { setAddInput(e.target.value); setAddError("") }}
            placeholder="Paste a friend's user ID"
            className="flex-1 rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1DB954]"
          />
          <button
            onClick={addFriend}
            className="rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-semibold text-black hover:bg-[#1ed760] transition"
          >
            Add
          </button>
        </div>
        {addError && <p className="mt-2 text-xs text-red-400">{addError}</p>}
        {friends.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {f.image && <img src={f.image} alt="" className="w-4 h-4 rounded-full" />}
                {f.name}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">live feed</h2>
        {feedEntries.length === 0 ? (
          <p className="text-zinc-600 text-sm">nothing playing right now — add friends and check back soon.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {feedEntries.map((entry) => (
              <NowPlayingCard key={entry.userId} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function NowPlayingCard({ entry }: { entry: NowPlayingEvent }) {
  return (
    <a
      href={entry.track?.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-600 transition"
    >
      {entry.track?.album_art && (
        <img src={entry.track.album_art} alt="" className="w-14 h-14 rounded-xl flex-shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {entry.userImage && (
            <img src={entry.userImage} alt="" className="w-5 h-5 rounded-full" />
          )}
          <span className="text-xs text-zinc-400">{entry.userName}</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-[#1DB954] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
            LIVE
          </span>
        </div>
        <p className="font-semibold text-white truncate">{entry.track?.name}</p>
        <p className="text-sm text-zinc-400 truncate">{entry.track?.artist}</p>
        <p className="text-xs text-zinc-600 truncate">{entry.track?.album}</p>
      </div>
    </a>
  )
}
