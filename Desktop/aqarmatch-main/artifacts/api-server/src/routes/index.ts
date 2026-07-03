import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import sellersRouter from "./sellers";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(sellersRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);

export default router;
