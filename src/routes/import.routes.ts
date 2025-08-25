import { Router, type Request, type Response } from "express";
import type { Router as RouterType } from "express";
import multer from "multer";
import { importJSON, testCSVImport } from "@controllers/import.controller.js";

// const upload = multer({ dest: "uploads/" });
export const routes: RouterType = Router();

routes.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));
routes.post("/import/json", (req: Request, res: Response) =>
  importJSON(req, res)
);
// routes.post("/import/csv", (req: Request, res: Response) =>
//   importCSV(req, res)
// );

routes.post("/import", (req: Request, res: Response) =>
  testCSVImport(req, res)
);
