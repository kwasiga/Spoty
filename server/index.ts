import express from "express"
import session from "express-session"
import connectPgSimple from "connect-pg-simple"
import passport from "passport"
import { createProxyMiddleware } from "http-proxy-middleware"
import { Pool } from "pg"
import { setupAuth } from "./routes/auth.js"
import spotifyRouter from "./routes/spotify.js"
import friendsRouter from "./routes/friends.js"

const app = express()
const PgSession = connectPgSimple(session)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

app.use(express.json())

app.use(
  session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
)

app.use(passport.initialize())
app.use(passport.session())

const authRouter = setupAuth(express.Router())
app.use("/api/auth", authRouter)
app.use("/api/spotify", spotifyRouter)
app.use("/api/friends", friendsRouter)

// proxy everything else to Vite dev server
app.use(
  createProxyMiddleware({
    target: "http://127.0.0.1:5173",
    changeOrigin: true,
    ws: true,
  })
)

const PORT = 3000
app.listen(PORT, "127.0.0.1", () =>
  console.log(`Server running on http://127.0.0.1:${PORT}`)
)
