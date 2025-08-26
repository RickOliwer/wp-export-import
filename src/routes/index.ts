import { Router, type Router as ExpressRouter } from "express";
import { routes as importRoutes } from "./import.routes.js";
import { default as customerRoutes } from "./customer.routes.js";

const router: ExpressRouter = Router();

router.use("/import", importRoutes);
router.use("/customers", customerRoutes);

export default router;
