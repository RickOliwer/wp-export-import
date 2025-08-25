import express, { type Request, type Response } from "express";
import "dotenv/config";

const app = express();
app.use(express.json());

app.get("/", (_req: Request, res: Response) =>
  res.json({ message: "WP Export/Import API" })
);
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

app.listen(3000, () => console.log("API on http://localhost:3000"));
