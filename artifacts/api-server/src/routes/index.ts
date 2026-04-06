import { Router, type IRouter } from "express";
import healthRouter from "./health";
import screenshotRouter from "./screenshot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(screenshotRouter);

export default router;
