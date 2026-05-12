import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

await pool.query(`
  CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "providerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE("userId", "providerId")
  );

  CREATE TABLE IF NOT EXISTS friendship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "friendId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE("userId", "friendId")
  );
  CREATE INDEX IF NOT EXISTS friendship_user_idx ON friendship("userId");
  CREATE INDEX IF NOT EXISTS friendship_friend_idx ON friendship("friendId");
`)

// Recreate session table with connect-pg-simple's expected schema
await pool.query(`
  DROP TABLE IF EXISTS session;
  CREATE TABLE session (
    sid  VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
  );
  CREATE INDEX IF NOT EXISTS session_expire_idx ON session (expire);
`)

console.log("Migration complete")
await pool.end()
