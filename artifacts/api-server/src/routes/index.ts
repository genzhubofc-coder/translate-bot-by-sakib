import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import translationsRouter from "./translations";
import statsRouter from "./stats";
import settingsRouter from "./settings";
import adminsRouter from "./admins";
import botRouter from "./bot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(translationsRouter);
router.use(statsRouter);
router.use(settingsRouter);
router.use(adminsRouter);
router.use(botRouter);

export default router;
