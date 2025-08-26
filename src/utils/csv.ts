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
    // Limit to first 50 rows for testing
    // if (rows.length >= 20) break;

    // Skip rows without email
    if (
      !rec.Email ||
      typeof rec.Email !== "string" ||
      rec.Email.trim() === ""
    ) {
      continue;
    }

    const row: ImportRow = {
      email: rec.Email.toLowerCase().trim(),
    };

    // Basic user info
    if (rec["invoiceAddress - FirstName"]) {
      row.first_name = rec["invoiceAddress - FirstName"];
    }
    if (rec["invoiceAddress - LastName"]) {
      row.last_name = rec["invoiceAddress - LastName"];
    }

    // Generate username from email if not provided
    row.username = rec.username || rec.Email.split("@")[0] || "user";

    // Set default role
    row.roles = ["customer"];

    // Build WooCommerce billing address
    row.wc_billing = {};
    if (rec["invoiceAddress - CompanyName"]) {
      row.wc_billing.company = rec["invoiceAddress - CompanyName"];
    }
    if (rec["invoiceAddress - FirstName"]) {
      row.wc_billing.first_name = rec["invoiceAddress - FirstName"];
    }
    if (rec["invoiceAddress - LastName"]) {
      row.wc_billing.last_name = rec["invoiceAddress - LastName"];
    }
    if (rec["invoiceAddress - Address"]) {
      row.wc_billing.address_1 = rec["invoiceAddress - Address"];
    }
    if (rec["invoiceAddress - PostalCode"]) {
      row.wc_billing.postcode = rec["invoiceAddress - PostalCode"];
    }
    if (rec["invoiceAddress - City"]) {
      row.wc_billing.city = rec["invoiceAddress - City"];
    }
    if (rec["invoiceAddress - CountryCode"]) {
      row.wc_billing.country = rec["invoiceAddress - CountryCode"];
    }
    if (rec["invoiceAddress - State"]) {
      row.wc_billing.state = rec["invoiceAddress - State"];
    }
    if (rec["invoiceAddress - PhoneNo"]) {
      row.wc_billing.phone = rec["invoiceAddress - PhoneNo"];
    }
    row.wc_billing.email = row.email;

    // Build WooCommerce shipping address
    row.wc_shipping = {};
    if (rec["deliveryAddress - CompanyName"]) {
      row.wc_shipping.company = rec["deliveryAddress - CompanyName"];
    }
    if (rec["deliveryAddress - FirstName"]) {
      row.wc_shipping.first_name = rec["deliveryAddress - FirstName"];
    }
    if (rec["deliveryAddress - LastName"]) {
      row.wc_shipping.last_name = rec["deliveryAddress - LastName"];
    }
    if (rec["deliveryAddress - Address"]) {
      row.wc_shipping.address_1 = rec["deliveryAddress - Address"];
    }
    if (rec["deliveryAddress - PostalCode"]) {
      row.wc_shipping.postcode = rec["deliveryAddress - PostalCode"];
    }
    if (rec["deliveryAddress - City"]) {
      row.wc_shipping.city = rec["deliveryAddress - City"];
    }
    if (rec["deliveryAddress - CountryCode"]) {
      row.wc_shipping.country = rec["deliveryAddress - CountryCode"];
    }
    if (rec["deliveryAddress - State"]) {
      row.wc_shipping.state = rec["deliveryAddress - State"];
    }
    if (rec["deliveryAddress - PhoneNo"]) {
      row.wc_shipping.phone = rec["deliveryAddress - PhoneNo"];
    }

    // If no shipping address provided, copy from billing
    if (
      !rec["deliveryAddress - FirstName"] &&
      !rec["deliveryAddress - LastName"]
    ) {
      row.wc_shipping = { ...row.wc_billing };
    }

    // Additional meta fields
    row.meta = {};

    if (rec.NationalIdNo) {
      row.meta.national_id = rec.NationalIdNo;
    }

    if (rec.LangCode) {
      // Map CSV language codes to WordPress locales
      const localeMap: Record<string, string> = {
        sv: "sv_SE",
        en: "en_US",
        sv_SE: "sv_SE",
        en_US: "en_US",
      };
      row.meta.locale = localeMap[rec.LangCode] || "en_US";
    }

    if (rec.Tags) {
      row.meta.customer_tags = rec.Tags;
    }

    if (rec.Pricelist) {
      row.meta.pricelist = rec.Pricelist;
    }

    // Store any Care Of, Attention, Reference fields
    if (rec["invoiceAddress - CareOf"]) {
      row.meta.billing_care_of = rec["invoiceAddress - CareOf"];
    }
    if (rec["invoiceAddress - Attention"]) {
      row.meta.billing_attention = rec["invoiceAddress - Attention"];
    }
    if (rec["invoiceAddress - Reference"]) {
      row.meta.billing_reference = rec["invoiceAddress - Reference"];
    }
    if (rec["deliveryAddress - CareOf"]) {
      row.meta.shipping_care_of = rec["deliveryAddress - CareOf"];
    }
    if (rec["deliveryAddress - Attention"]) {
      row.meta.shipping_attention = rec["deliveryAddress - Attention"];
    }
    if (rec["deliveryAddress - Reference"]) {
      row.meta.shipping_reference = rec["deliveryAddress - Reference"];
    }

    // Mobile phone number
    if (rec["invoiceAddress - MobilePhoneNo"]) {
      row.meta.billing_mobile_phone = rec["invoiceAddress - MobilePhoneNo"];
    }
    if (rec["deliveryAddress - MobilePhoneNo"]) {
      row.meta.shipping_mobile_phone = rec["deliveryAddress - MobilePhoneNo"];
    }

    rows.push(row);
  }

  if (!rows.length) throw new Error("No rows found");
  return rows;
}

// Keep the legacy function for backward compatibility
export async function loadCSVLegacy(path: string): Promise<ImportRow[]> {
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
