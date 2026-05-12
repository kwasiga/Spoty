import { useEffect, useRef, useState } from "react"
import Pusher from "pusher-js"
import { getFriends, followFriend, unfollowFriend, broadcast } from "../lib/api"

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
  const [showAdd, setShowAdd] = useState(false)
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
      setShowAdd(false)
      const updated = await getFriends()
      setFriends(updated)
    } catch (err: unknown) {
      setAddError((err as Error).message ?? "Something went wrong")
    }
  }

  async function removeFriend(id: string) {
    await unfollowFriend(id)
    setFriends((prev) => prev.filter((f) => f.id !== id))
  }

  function copyId() {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const feedEntries = Object.values(feed).filter((e) => e.is_playing)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Friends</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-[10px] text-[#1DB954] hover:text-[#1ed760] transition font-medium"
        >
          {showAdd ? "cancel" : "+ add"}
        </button>
      </div>

      {/* add friend panel */}
      {showAdd && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-black/30 border border-white/10 px-3 py-1.5">
            <span className="text-[10px] text-zinc-500 flex-shrink-0">Your ID</span>
            <span className="flex-1 truncate font-mono text-[10px] text-zinc-400">{userId}</span>
            <button onClick={copyId} className="text-[10px] text-[#1DB954] hover:text-[#1ed760] transition flex-shrink-0">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={addInput}
              onChange={(e) => { setAddInput(e.target.value); setAddError("") }}
              placeholder="Paste friend's user ID"
              className="flex-1 rounded-xl bg-black/30 border border-white/10 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#1DB954]"
            />
            <button
              onClick={addFriend}
              className="rounded-xl bg-[#1DB954] px-3 py-1.5 text-xs font-semibold text-black hover:bg-[#1ed760] transition"
            >
              Add
            </button>
          </div>
          {addError && <p className="text-[10px] text-red-400">{addError}</p>}
        </div>
      )}

      {/* friends list */}
      {friends.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 pl-2 pr-1.5 py-1 text-[10px] text-zinc-300">
              {f.image && <img src={f.image} alt="" className="w-3.5 h-3.5 rounded-full" />}
              <span>{f.name}</span>
              <button
                onClick={() => removeFriend(f.id)}
                className="ml-0.5 text-zinc-600 hover:text-red-400 transition leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* divider */}
      {friends.length > 0 && <div className="border-t border-white/5" />}

      {/* live feed */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {feedEntries.length === 0 ? (
          <p className="text-zinc-600 text-xs">
            {friends.length === 0
              ? "Add friends to see what they're listening to."
              : "Nothing playing right now."}
          </p>
        ) : (
          feedEntries.map((entry) => (
            <a
              key={entry.userId}
              href={entry.track?.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/5 p-3 hover:border-white/15 transition"
            >
              {entry.track?.album_art && (
                <img src={entry.track.album_art} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {entry.userImage && (
                    <img src={entry.userImage} alt="" className="w-4 h-4 rounded-full flex-shrink-0" />
                  )}
                  <span className="text-[10px] text-zinc-500 truncate">{entry.userName}</span>
                  <span className="ml-auto flex items-center gap-1 text-[9px] text-[#1DB954] font-semibold flex-shrink-0">
                    <span className="w-1 h-1 rounded-full bg-[#1DB954] animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs font-semibold text-white truncate">{entry.track?.name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{entry.track?.artist}</p>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  )
}
