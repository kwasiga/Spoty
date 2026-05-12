import { Router } from "express"
import { requireAuth } from "../middleware/requireAuth.js"
import { db } from "../lib/db.js"

const router = Router()
router.use(requireAuth)

router.patch("/me", async (req, res) => {
  const user = req.user as { id: string }
  const { name } = req.body as { name?: string }
  if (!name || !name.trim()) { res.status(400).json({ error: "Name is required" }); return }

  const updated = await db
    .updateTable("user")
    .set({ name: name.trim(), updatedAt: new Date() })
    .where("id", "=", user.id)
    .returningAll()
    .executeTakeFirstOrThrow()

  res.json({ user: updated })
})

router.delete("/me", async (req, res) => {
  const user = req.user as { id: string }

  await db.deleteFrom("account").where("userId", "=", user.id).execute()
  await db.deleteFrom("friendship").where("userId", "=", user.id).orWhere("friendId", "=", user.id).execute()
  await db.deleteFrom("user").where("id", "=", user.id).execute()

  req.logout(() => {
    res.json({ ok: true })
  })
})

export default router
