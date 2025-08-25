import type { ImportRow } from "@utils/types/user.js";
import {
  createCustomer,
  getWooCommerceCustomer,
  updateCustomer,
} from "@clients/customer.fn.js";

export async function upsertCustomers(rows: ImportRow[], chunkSize = 10) {
  const results: Array<{
    status: string;
    email: string;
    id?: number;
    error?: string;
  }> = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    console.log(
      `Processing customer chunk ${Math.floor(i / chunkSize) + 1}: ${chunk.length} customers`
    );

    const chunkResults = await processCustomerChunk(chunk);
    results.push(...chunkResults);

    console.log("Chunk results:", chunkResults);
  }

  return results;
}

async function processCustomerChunk(rows: ImportRow[]) {
  const results: Array<{
    status: string;
    email: string;
    id?: number;
    error?: string;
  }> = [];

  const promises = rows.map(async (row) => {
    try {
      // Check if customer already exists
      const existingCustomer = await getWooCommerceCustomer(row.email);

      if (existingCustomer) {
        console.log(
          `Customer ${row.email} already exists with ID ${existingCustomer.id}, updating...`
        );
        const updatedCustomer = await updateCustomer(existingCustomer.id, row);
        return { status: "updated", email: row.email, id: updatedCustomer.id };
      } else {
        console.log(`Creating new customer ${row.email}...`);
        const newCustomer = await createCustomer(row);
        return { status: "created", email: row.email, id: newCustomer.id };
      }
    } catch (error) {
      console.error(`Failed to process customer ${row.email}:`, error);
      return {
        status: "error",
        email: row.email,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const chunkResults = await Promise.all(promises);
  return chunkResults;
}
