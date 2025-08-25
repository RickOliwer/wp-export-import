import type { Request, Response } from "express";
import { loadCSV } from "@utils/csv.js";
import { upsertUsers } from "@services/import.service.js";
import type { ImportRow } from "@utils/types/user.js";

export async function importCSV(req: Request, res: Response) {
  const file = req.file as Express.Multer.File;
  if (!file) return res.status(400).json({ error: "file missing" });

  const rows = await loadCSV(file.path);

  // For large imports, consider streaming the response
  if (rows.length > 100) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    // Process in chunks and stream results
    // Implementation details...
  } else {
    const result = await upsertUsers(rows);
    res.json(result);
  }
}

export async function importJSON(req: Request, res: Response) {
  const rows = Array.isArray(req.body?.rows)
    ? req.body.rows
    : ([] as ImportRow[]);
  const result = await upsertUsers(rows);
  res.json(result);
}

export async function testCSVImport(req: Request, res: Response) {
  console.log("Testing CSV import...");

  try {
    const filename = req.body?.filename || "users.csv";
    console.log(`Loading CSV file: ${filename}`);

    const rows = await loadCSV(`uploads/${filename}`);
    console.log(`Loaded ${rows.length} rows`);
    console.log("First row sample:", JSON.stringify(rows[0], null, 2));

    const result = await upsertUsers(rows);
    console.log("Import completed");

    res.json({
      success: true,
      message: `Processed ${rows.length} rows`,
      results: result,
    });
  } catch (error: unknown) {
    console.error(
      "❌ CSV test failed:",
      error instanceof Error ? error.message : String(error)
    );

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
