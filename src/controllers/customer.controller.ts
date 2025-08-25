import type { Request, Response } from "express";
import { loadCSV } from "@utils/csv.js";
import { upsertCustomers } from "@services/customer.service.js";
import { HttpError } from "@utils/httpError.js";

export async function importCustomers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { file, chunk_size }: { file?: string; chunk_size?: string } =
      req.body;

    if (!file) {
      throw new HttpError(400, "File path is required");
    }

    const chunkSize = parseInt(chunk_size || "10", 10);

    console.log(
      `Starting customer import from ${file} with chunk size ${chunkSize}`
    );

    // Load and parse CSV
    const rows = await loadCSV(file);
    console.log(`Loaded ${rows.length} rows from CSV`);

    // Import customers
    const results = await upsertCustomers(rows, chunkSize);

    console.log("Customer import completed");
    res.json({
      success: true,
      message: "Customer import completed",
      total: rows.length,
      results,
      summary: {
        created: results.filter((r) => r.status === "created").length,
        updated: results.filter((r) => r.status === "updated").length,
        errors: results.filter((r) => r.status === "error").length,
      },
    });
  } catch (error) {
    console.error("Customer import failed:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
