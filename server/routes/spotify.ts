import { Router } from "express"
import { requireAuth } from "../middleware/requireAuth.js"
import { db } from "../lib/db.js"
import { pusher } from "../lib/pusher.js"

async function getToken(userId: string) {
  const account = await db
    .selectFrom("account")
    .where("userId", "=", userId)
    .where("providerId", "=", "spotify")
    .select(["accessToken"])
    .executeTakeFirst()
  return account?.accessToken ?? null
}

async function spotifyFetch(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  return res.json()
}

const router = Router()
router.use(requireAuth)

router.get("/now-playing", async (req, res) => {
  const user = req.user as { id: string }
  const token = await getToken(user.id)
  if (!token) { res.status(400).json({ error: "No Spotify account" }); return }

  const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (r.status === 204 || r.status === 404) { res.json({ is_playing: false }); return }
  if (!r.ok) { res.status(r.status).json({ error: "Spotify API error" }); return }

  const data = await r.json()
  const track = data.item
  res.json({
    is_playing: data.is_playing,
    track: {
      id: track?.id,
      name: track?.name,
      artist: track?.artists?.map((a: { name: string }) => a.name).join(", "),
      album: track?.album?.name,
      album_art: track?.album?.images?.[0]?.url,
      url: track?.external_urls?.spotify,
    },
  })
})

router.get("/stats", async (req, res) => {
  const user = req.user as { id: string }
  const token = await getToken(user.id)
  if (!token) { res.status(400).json({ error: "No Spotify account" }); return }

  const [recentlyPlayed, topTracks, topArtists] = await Promise.all([
    spotifyFetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", token),
    spotifyFetch("https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term", token),
    spotifyFetch("https://api.spotify.com/v1/me/top/artists?limit=1&time_range=short_term", token),
  ])

  const lastPlayed = recentlyPlayed?.items?.[0]
    ? {
        name: recentlyPlayed.items[0].track.name,
        artist: recentlyPlayed.items[0].track.artists.map((a: { name: string }) => a.name).join(", "),
        album_art: recentlyPlayed.items[0].track.album.images?.[0]?.url,
        url: recentlyPlayed.items[0].track.external_urls.spotify,
        played_at: recentlyPlayed.items[0].played_at,
      }
    : null

  const msListened: number =
    recentlyPlayed?.items?.reduce(
      (sum: number, item: { track: { duration_ms: number } }) => sum + item.track.duration_ms,
      0
    ) ?? 0
  const hoursListened = Math.round((msListened / 3_600_000) * 10) / 10

  const top10 =
    topTracks?.items?.map((t: {
      id: string; name: string;
      artists: { name: string }[];
      album: { name: string; images: { url: string }[] };
      external_urls: { spotify: string };
      duration_ms: number;
    }) => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      album: t.album.name,
      album_art: t.album.images?.[0]?.url,
      url: t.external_urls.spotify,
      duration_ms: t.duration_ms,
    })) ?? []

  const topArtist = topArtists?.items?.[0]
    ? {
        name: topArtists.items[0].name,
        image: topArtists.items[0].images?.[0]?.url,
        url: topArtists.items[0].external_urls.spotify,
        genres: topArtists.items[0].genres?.slice(0, 3),
      }
    : null

  res.json({ lastPlayed, top10, hoursListened, topArtist })
})

router.post("/broadcast", async (req, res) => {
  const user = req.user as { id: string; name: string; image: string | null }
  const token = await getToken(user.id)
  if (!token) { res.status(400).json({ error: "No Spotify account" }); return }

  const r = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${token}` },
  })

  let payload: Record<string, unknown> = { is_playing: false, userId: user.id }

  if (r.ok && r.status !== 204) {
    const data = await r.json()
    const track = data.item
    payload = {
      is_playing: data.is_playing,
      userId: user.id,
      userName: user.name,
      userImage: user.image,
      track: {
        id: track?.id,
        name: track?.name,
        artist: track?.artists?.map((a: { name: string }) => a.name).join(", "),
        album: track?.album?.name,
        album_art: track?.album?.images?.[0]?.url,
        url: track?.external_urls?.spotify,
      },
    }
  }

  const followers = await db
    .selectFrom("friendship")
    .where("friendId", "=", user.id)
    .select(["userId"])
    .execute()

  await Promise.all(
    followers.map((f) => pusher.trigger(`user-${f.userId}`, "now-playing", payload))
  )

  res.json({ ok: true, notified: followers.length })
})

export default router
