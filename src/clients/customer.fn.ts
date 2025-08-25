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

function buildWooCommerceCustomerPayload(
  row: ImportRow
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

  const payload: CreateWooCommerceCustomerPayload = {
    email: row.email,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    username: row.username ?? row.email.split("@")[0] ?? "user",
    password: row.password ?? buildPasswordFromName(row.email),
    billing: row.wc_billing
      ? {
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
        }
      : undefined,
    shipping: row.wc_shipping
      ? {
          first_name: row.wc_shipping.first_name,
          last_name: row.wc_shipping.last_name,
          company: row.wc_shipping.company,
          address_1: row.wc_shipping.address_1,
          address_2: row.wc_shipping.address_2,
          city: row.wc_shipping.city,
          state: row.wc_shipping.state,
          postcode: row.wc_shipping.postcode,
          country: row.wc_shipping.country,
        }
      : undefined,
    meta_data: metaData,
  };

  return payload;
}

async function createCustomer(row: ImportRow) {
  if (!row.email) throw new Error("Email is required");

  console.log(
    "Creating WooCommerce customer with row:",
    JSON.stringify(row, null, 2)
  );

  const payload = buildWooCommerceCustomerPayload(row);
  console.log(
    "WooCommerce customer payload:",
    JSON.stringify(payload, null, 2)
  );

  const customer = await wc<WooCommerceCustomer>("/wp-json/wc/v3/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("Created WooCommerce customer ID:", customer.id);
  console.log("Customer meta data:", customer.meta_data);

  return customer;
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

  const payload: UpdateWooCommerceCustomerPayload = {
    first_name: row.first_name,
    last_name: row.last_name,
    billing: row.wc_billing
      ? {
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
        }
      : undefined,
    shipping: row.wc_shipping
      ? {
          first_name: row.wc_shipping.first_name,
          last_name: row.wc_shipping.last_name,
          company: row.wc_shipping.company,
          address_1: row.wc_shipping.address_1,
          address_2: row.wc_shipping.address_2,
          city: row.wc_shipping.city,
          state: row.wc_shipping.state,
          postcode: row.wc_shipping.postcode,
          country: row.wc_shipping.country,
        }
      : undefined,
    meta_data: metaData,
  };

  const customer = await wc<WooCommerceCustomer>(
    `/wp-json/wc/v3/customers/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

  console.log("Updated WooCommerce customer ID:", customer.id);
  return customer;
}

export { getWooCommerceCustomer, createCustomer, updateCustomer };
