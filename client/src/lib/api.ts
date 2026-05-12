const BASE = "/api"

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: "include", ...opts })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.error ?? "Request failed"), { status: res.status })
  }
  return res.json()
}

export function getSession() {
  return req<{ user: { id: string; name: string; image: string | null } }>("/auth/session")
}

export function getStats() {
  return req<{
    lastPlayed: { name: string; artist: string; album_art?: string; url: string } | null
    top10: { id: string; name: string; artist: string; album: string; album_art?: string; url: string; duration_ms: number }[]
    hoursListened: number
    topArtist: { name: string; image?: string; url: string; genres: string[] } | null
  }>("/spotify/stats")
}

export function getNowPlaying() {
  return req<{
    is_playing: boolean
    track?: { id: string; name: string; artist: string; album: string; album_art?: string; url: string }
  }>("/spotify/now-playing")
}

export function broadcast() {
  return req("/spotify/broadcast", { method: "POST" })
}

export function getFriends() {
  return req<{ id: string; name: string; image: string | null }[]>("/friends")
}

export function followFriend(friendId: string) {
  return req("/friends/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friendId }),
  })
}

export function unfollowFriend(id: string) {
  return req(`/friends/unfollow/${id}`, { method: "DELETE" })
}

export function updateMe(name: string) {
  return req<{ user: { id: string; name: string; image: string | null } }>("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
}

export function deleteMe() {
  return req("/users/me", { method: "DELETE" })
}

export function logout() {
  return req("/auth/logout", { method: "POST" })
}
