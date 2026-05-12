import { Router } from "express"
import { requireAuth } from "../middleware/requireAuth.js"
import { db } from "../lib/db.js"

const router = Router()
router.use(requireAuth)

router.get("/", async (req, res) => {
  const user = req.user as { id: string }
  const friends = await db
    .selectFrom("friendship")
    .innerJoin("user", "user.id", "friendship.friendId")
    .where("friendship.userId", "=", user.id)
    .select(["user.id", "user.name", "user.image", "friendship.createdAt"])
    .execute()
  res.json(friends)
})

router.post("/follow", async (req, res) => {
  const user = req.user as { id: string }
  const { friendId } = req.body as { friendId?: string }
  if (!friendId) { res.status(400).json({ error: "friendId required" }); return }
  if (friendId === user.id) { res.status(400).json({ error: "Cannot add yourself" }); return }

  const friend = await db.selectFrom("user").where("id", "=", friendId).select(["id"]).executeTakeFirst()
  if (!friend) { res.status(404).json({ error: "User not found" }); return }

  await db
    .insertInto("friendship")
    .values({ id: crypto.randomUUID(), userId: user.id, friendId, createdAt: new Date() })
    .onConflict((oc) => oc.columns(["userId", "friendId"]).doNothing())
    .execute()

  res.json({ ok: true })
})

router.delete("/unfollow/:id", async (req, res) => {
  const user = req.user as { id: string }
  await db
    .deleteFrom("friendship")
    .where("userId", "=", user.id)
    .where("friendId", "=", req.params.id)
    .execute()
  res.json({ ok: true })
})

export default router
