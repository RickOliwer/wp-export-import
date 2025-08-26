import type { ImportRow } from "@utils/types/user.js";

function buildMeta(row: ImportRow) {
  const meta: Record<string, string> = {
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    // Ultimate Member required fields
    account_status: "approved", // Critical for UM to recognize the user
    um_member_directory_data: "a:0:{}", // Empty serialized array for directory data
  };

  if (row.um_role) {
    meta["um_role"] = row.um_role; // UM reads this usermeta
    meta["role"] = row.um_role; // Some versions also check this
  }

  for (const [k, v] of Object.entries(row.meta ?? {})) meta[k] = String(v);

  // WooCommerce billing fields - these should show up in the form
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

function buildPasswordFromName(firstname: string): string {
  return firstname
    .toLowerCase()
    .replace(/a/g, "@")
    .replace(/i/g, "1")
    .replace(/e/g, "3")
    .replace(/o/g, "0")
    .replace(/b/g, "8")
    .replace(/s/g, "$");
}

export { buildMeta, randPass, buildPasswordFromName };
