import { Router } from "express";
import { db } from "@workspace/db";
import { cloudBackupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.put("/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const { data } = req.body as { data?: string };
  if (!deviceId || typeof data !== "string") {
    res.status(400).json({ error: "deviceId and data are required" });
    return;
  }
  await db
    .insert(cloudBackupsTable)
    .values({ deviceId, data })
    .onConflictDoUpdate({
      target: cloudBackupsTable.deviceId,
      set: { data, updatedAt: new Date() },
    });
  res.json({ ok: true });
});

router.get("/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const rows = await db
    .select()
    .from(cloudBackupsTable)
    .where(eq(cloudBackupsTable.deviceId, deviceId));
  if (!rows.length) {
    res.status(404).json({ error: "No cloud backup found for this device." });
    return;
  }
  res.json({ data: rows[0].data, updatedAt: rows[0].updatedAt });
});

export default router;
