import type { ImportRow } from "./types/user.js";

function buildMeta(row: ImportRow) {
  const meta: Record<string, string> = {
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
  };
  if (row.um_role) meta["um_role"] = row.um_role; // UM reads this usermeta
  for (const [k, v] of Object.entries(row.meta ?? {})) meta[k] = String(v);
  for (const [k, v] of Object.entries(row.wc_billing ?? {}))
    meta[`billing_${k}`] = String(v);
  for (const [k, v] of Object.entries(row.wc_shipping ?? {}))
    meta[`shipping_${k}`] = String(v);
  return meta;
}

function randPass() {
  const buf = new Uint8Array(12);
  globalThis.crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("base64url");
}

export { buildMeta, randPass };
