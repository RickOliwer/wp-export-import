import type {
  CreateWooCommerceCustomerPayload,
  WooCommerceCustomer,
  UpdateWooCommerceCustomerPayload,
} from "@utils/types/wordpress.js";
import { wc } from "./woocommerce.client.js";
import type { ImportRow } from "@utils/types/user.js";
import { buildPasswordFromName } from "@utils/index.js";
import { env } from "config/index.js";

async function getWooCommerceCustomer(email: string) {
  const url = new URL("/wp-json/wc/v3/customers", env.WP_SITE);
  url.searchParams.set("email", email);
  try {
    const customers = await wc<WooCommerceCustomer[]>(
      url.pathname + "?" + url.searchParams.toString(),
      { method: "GET" }
    );
    return customers.find(
      (c) => c.email?.toLowerCase() === email.toLowerCase()
    );
  } catch (error) {
    // Customer not found
    return null;
  }
}

function generateUniqueUsername(
  baseUsername: string,
  attempt: number = 0
): string {
  if (attempt === 0) {
    return baseUsername;
  }

  // For subsequent attempts, use a simple incremental approach with some randomness
  // This creates usernames like: claes.andersson_2, sara_3, info_1
  const randomSuffix = Math.floor(Math.random() * 99) + 1; // 1-99
  return `${baseUsername}_${attempt}${randomSuffix}`;
}

function buildWooCommerceCustomerPayload(
  row: ImportRow,
  usernameAttempt: number = 0
): CreateWooCommerceCustomerPayload {
  const metaData: Array<{ key: string; value: string }> = [];

  // Add Ultimate Member required fields as meta
  metaData.push(
    { key: "account_status", value: "approved" },
    { key: "um_member_directory_data", value: "a:0:{}" }
  );

  if (row.um_role) {
    metaData.push(
      { key: "um_role", value: row.um_role },
      { key: "role", value: row.um_role }
    );
  }

  // Add custom meta fields
  for (const [k, v] of Object.entries(row.meta ?? {})) {
    metaData.push({ key: k, value: String(v) });
  }

  // Generate username with attempt number for uniqueness
  const baseUsername = row.username ?? row.email.split("@")[0] ?? "user";
  const username = generateUniqueUsername(baseUsername, usernameAttempt);

  // Build payload with proper type handling for exactOptionalPropertyTypes
  const payload: CreateWooCommerceCustomerPayload = {
    email: row.email,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    username: username,
    password: row.password ?? buildPasswordFromName(row.email),
    meta_data: metaData,
  };

  // Add billing if present
  if (row.wc_billing) {
    const billingEntries = Object.entries({
      first_name: row.wc_billing.first_name,
      last_name: row.wc_billing.last_name,
      company: row.wc_billing.company,
      address_1: row.wc_billing.address_1,
      address_2: row.wc_billing.address_2,
      city: row.wc_billing.city,
      state: row.wc_billing.state,
      postcode: row.wc_billing.postcode,
      country: row.wc_billing.country,
      email: row.wc_billing.email,
      phone: row.wc_billing.phone,
    }).filter(([_, value]) => value !== undefined);

    if (billingEntries.length > 0) {
      payload.billing = Object.fromEntries(billingEntries);
    }
  }

  // Add shipping if present
  if (row.wc_shipping) {
    const shippingEntries = Object.entries({
      first_name: row.wc_shipping.first_name,
      last_name: row.wc_shipping.last_name,
      company: row.wc_shipping.company,
      address_1: row.wc_shipping.address_1,
      address_2: row.wc_shipping.address_2,
      city: row.wc_shipping.city,
      state: row.wc_shipping.state,
      postcode: row.wc_shipping.postcode,
      country: row.wc_shipping.country,
    }).filter(([_, value]) => value !== undefined);

    if (shippingEntries.length > 0) {
      payload.shipping = Object.fromEntries(shippingEntries);
    }
  }

  return payload;
}

async function createCustomer(row: ImportRow) {
  if (!row.email) throw new Error("Email is required");

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const payload = buildWooCommerceCustomerPayload(row, attempt);

      const customer = await wc<WooCommerceCustomer>(
        "/wp-json/wc/v3/customers",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      // Log only if we had to retry due to username conflicts
      if (attempt > 0) {
        console.log(
          `✓ Created ${row.email} with unique username "${payload.username}" (attempt ${attempt + 1})`
        );
      }

      return customer;
    } catch (error: any) {
      // Check if it's a username conflict error
      if (
        error?.message?.includes("registration-error-username-exists") &&
        attempt < maxAttempts - 1
      ) {
        console.log(
          `⚠ Username conflict for ${row.email}, retrying... (attempt ${attempt + 1})`
        );
        attempt++;
        continue;
      }

      // If it's not a username error or we've exhausted attempts, throw the error
      throw error;
    }
  }

  throw new Error(
    `Failed to create customer ${row.email} after ${maxAttempts} attempts`
  );
}

async function updateCustomer(id: number, row: ImportRow) {
  const metaData: Array<{ key: string; value: string }> = [];

  // Add Ultimate Member required fields
  metaData.push(
    { key: "account_status", value: "approved" },
    { key: "um_member_directory_data", value: "a:0:{}" }
  );

  if (row.um_role) {
    metaData.push(
      { key: "um_role", value: row.um_role },
      { key: "role", value: row.um_role }
    );
  }

  // Add custom meta fields
  for (const [k, v] of Object.entries(row.meta ?? {})) {
    metaData.push({ key: k, value: String(v) });
  }

  // Build payload with proper type handling for exactOptionalPropertyTypes
  const payload: UpdateWooCommerceCustomerPayload = {
    meta_data: metaData,
  };

  // Add first_name if present
  if (row.first_name !== undefined) {
    payload.first_name = row.first_name;
  }

  // Add last_name if present
  if (row.last_name !== undefined) {
    payload.last_name = row.last_name;
  }

  // Add billing if present
  if (row.wc_billing) {
    const billingEntries = Object.entries({
      first_name: row.wc_billing.first_name,
      last_name: row.wc_billing.last_name,
      company: row.wc_billing.company,
      address_1: row.wc_billing.address_1,
      address_2: row.wc_billing.address_2,
      city: row.wc_billing.city,
      state: row.wc_billing.state,
      postcode: row.wc_billing.postcode,
      country: row.wc_billing.country,
      email: row.wc_billing.email,
      phone: row.wc_billing.phone,
    }).filter(([_, value]) => value !== undefined);

    if (billingEntries.length > 0) {
      payload.billing = Object.fromEntries(billingEntries);
    }
  }

  // Add shipping if present
  if (row.wc_shipping) {
    const shippingEntries = Object.entries({
      first_name: row.wc_shipping.first_name,
      last_name: row.wc_shipping.last_name,
      company: row.wc_shipping.company,
      address_1: row.wc_shipping.address_1,
      address_2: row.wc_shipping.address_2,
      city: row.wc_shipping.city,
      state: row.wc_shipping.state,
      postcode: row.wc_shipping.postcode,
      country: row.wc_shipping.country,
    }).filter(([_, value]) => value !== undefined);

    if (shippingEntries.length > 0) {
      payload.shipping = Object.fromEntries(shippingEntries);
    }
  }

  const customer = await wc<WooCommerceCustomer>(
    `/wp-json/wc/v3/customers/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

  return customer;
}

export { getWooCommerceCustomer, createCustomer, updateCustomer };
