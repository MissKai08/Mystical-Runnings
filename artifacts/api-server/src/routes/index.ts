import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cloudBackupRouter from "./cloudBackup";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/cloud-backup", cloudBackupRouter);

export default router;
