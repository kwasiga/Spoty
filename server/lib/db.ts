import { Kysely, PostgresDialect } from "kysely"
import { Pool } from "pg"

interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

interface AccountTable {
  id: string
  userId: string
  providerId: string
  accountId: string
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface FriendshipTable {
  id: string
  userId: string
  friendId: string
  createdAt: Date
}

export interface Database {
  user: UserTable
  account: AccountTable
  friendship: FriendshipTable
}

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})
