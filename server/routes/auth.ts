import { Router } from "express"
import passport from "passport"
import { Strategy as SpotifyStrategy } from "passport-spotify"
import { db } from "../lib/db.js"

export function setupAuth(app: Router) {
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_CLIENT_ID!,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
        callbackURL: "http://127.0.0.1:3000/api/auth/callback/spotify",
        scope: [
          "user-read-currently-playing",
          "user-read-recently-played",
          "user-top-read",
          "user-read-email",
        ],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const spotifyId = profile.id
          const email = profile.emails?.[0]?.value ?? `${spotifyId}@spotify.local`
          const name = profile.displayName ?? profile.username ?? spotifyId
          const image = profile.photos?.[0] ?? null

          // upsert user
          let user = await db
            .selectFrom("user")
            .where("email", "=", email)
            .selectAll()
            .executeTakeFirst()

          if (!user) {
            user = await db
              .insertInto("user")
              .values({
                id: crypto.randomUUID(),
                name,
                email,
                emailVerified: true,
                image,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returningAll()
              .executeTakeFirstOrThrow()
          } else {
            await db
              .updateTable("user")
              .set({ name, image, updatedAt: new Date() })
              .where("id", "=", user.id)
              .execute()
            user = { ...user, name, image }
          }

          // upsert account
          const existingAccount = await db
            .selectFrom("account")
            .where("userId", "=", user.id)
            .where("providerId", "=", "spotify")
            .select(["id"])
            .executeTakeFirst()

          if (existingAccount) {
            await db
              .updateTable("account")
              .set({ accessToken, refreshToken, updatedAt: new Date() })
              .where("id", "=", existingAccount.id)
              .execute()
          } else {
            await db
              .insertInto("account")
              .values({
                id: crypto.randomUUID(),
                userId: user.id,
                providerId: "spotify",
                accountId: spotifyId,
                accessToken,
                refreshToken,
                accessTokenExpiresAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .execute()
          }

          return done(null, user)
        } catch (err) {
          return done(err as Error)
        }
      }
    )
  )

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { id: string }).id)
  })

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await db
        .selectFrom("user")
        .where("id", "=", id)
        .selectAll()
        .executeTakeFirst()
      done(null, user ?? false)
    } catch (err) {
      done(err)
    }
  })

  const router = Router()

  router.get("/login", passport.authenticate("spotify"))

  router.get(
    "/callback/spotify",
    passport.authenticate("spotify", { failureRedirect: "http://127.0.0.1:3000/onboarding" }),
    (_req, res) => res.redirect("http://127.0.0.1:3000/dashboard")
  )

  router.post("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err)
      res.json({ ok: true })
    })
  })

  router.get("/session", (req, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }
    res.json({ user: req.user })
  })

  return router
}
