# Spoty

A Spotify stats dashboard with real-time friend activity. Connect your Spotify account to see your top tracks, top artist, hours listened, and what your friends are listening to — live.

## Screenshots

### Your Dashboard
![Spoty Dashboard]

<img width="750px" height="750px" alt="User Dashboard" src="https://github.com/user-attachments/assets/465953e6-f20a-4ae4-8d33-85c82422f28b" />


See your listening stats for the month: top 10 tracks, top artist, hours listened, top genre, and last played track — all pulled from your Spotify history.

### Friends Activity
![Friends View]

<img width="750px" height="750px" alt="Friend Dashboard" src="https://github.com/user-attachments/assets/3e540508-57e4-4e29-b417-f5e7066c3d79" />


Add friends by their Spotify username and see what they're playing in real time, powered by Pusher WebSockets.

## Features

- **Spotify OAuth** — sign in with your Spotify account via Passport.js
- **Listening Stats** — top 10 tracks, top artist, top genre, hours listened (last 50 plays), and last played
- **Now Playing** — shows your currently playing track in the navbar
- **Friends** — add friends and see their live playback status with real-time updates
- **Real-time sync** — friend activity updates instantly via Pusher

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, tsx |
| Auth | Passport.js + passport-spotify |
| Database | PostgreSQL (Kysely query builder) |
| Sessions | express-session + connect-pg-simple |
| Real-time | Pusher |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Spotify Developer app ([create one here](https://developer.spotify.com/dashboard))
- Pusher account ([create one here](https://pusher.com))

### Environment Variables

Create a `.env` file in the project root:

```env
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_CALLBACK_URL=http://localhost:3000/auth/spotify/callback

# Session
SESSION_SECRET=your_session_secret

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/spoty

# Pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

### Install & Run

```bash
# Install dependencies for both server and client
npm run install:all

# Run database migrations
npm run migrate

# Start the server (runs on :3000)
npm run dev:server

# Start the client (runs on :5173)
npm run dev:client
```

Then open [http://localhost:5173](http://localhost:5173) and sign in with Spotify.
