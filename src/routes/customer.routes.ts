import { Router } from "express";
import type { Router as RouterType } from "express";
import { importCustomers } from "@controllers/customer.controller.js";

const router: RouterType = Router();

router.post("/import", importCustomers);

export default router;
