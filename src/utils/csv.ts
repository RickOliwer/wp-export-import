import fs from "node:fs";
import { parse } from "csv-parse";
import type { ImportRow } from "./types/user.js";

export async function loadCSV(path: string): Promise<ImportRow[]> {
  const rows: ImportRow[] = [];
  if (!fs.existsSync(path)) throw new Error(`File ${path} does not exist`);
  const parser = fs
    .createReadStream(path)
    .pipe(parse({ columns: true, trim: true }));
  for await (const rec of parser) {
    // Skip rows without email
    if (
      !rec.email ||
      typeof rec.email !== "string" ||
      rec.email.trim() === ""
    ) {
      continue;
    }

    const row: ImportRow = {
      email: rec.email as string,
    };

    if (rec.username) row.username = rec.username;
    if (rec.password) row.password = rec.password;
    if (rec.first_name) row.first_name = rec.first_name;
    if (rec.last_name) row.last_name = rec.last_name;
    if (rec.roles) {
      row.roles = String(rec.roles)
        .split("|")
        .map((s: string) => s.trim());
    }
    if (rec.um_role) row.um_role = rec.um_role;
    if (rec.meta) {
      const parsedMeta = safeJSON(rec.meta);
      if (parsedMeta) row.meta = parsedMeta;
    }
    if (rec.wc_billing) {
      const parsedBilling = safeJSON(rec.wc_billing);
      if (parsedBilling) row.wc_billing = parsedBilling;
    }
    if (rec.wc_shipping) {
      const parsedShipping = safeJSON(rec.wc_shipping);
      if (parsedShipping) row.wc_shipping = parsedShipping;
    }

    rows.push(row);
  }
  if (!rows.length) throw new Error("No rows found");
  return rows;
}

function safeJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}
