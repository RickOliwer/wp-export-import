import type { ImportRow } from "@utils/types/user.js";
import {
  createCustomer,
  getWooCommerceCustomer,
  updateCustomer,
} from "@clients/customer.fn.js";

export async function upsertCustomers(rows: ImportRow[], chunkSize = 50) {
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

    // Show summary for this chunk
    const created = chunkResults.filter((r) => r.status === "created").length;
    const updated = chunkResults.filter((r) => r.status === "updated").length;
    const errors = chunkResults.filter((r) => r.status === "error");

    console.log(
      `Chunk summary: ${created} created, ${updated} updated, ${errors.length} failed`
    );

    // Only show error details
    if (errors.length > 0) {
      console.log("Failed customers:");
      errors.forEach((error) => {
        console.log(`  - ${error.email}: ${error.error}`);
      });
    }
  }

  // Show overall summary
  const totalCreated = results.filter((r) => r.status === "created").length;
  const totalUpdated = results.filter((r) => r.status === "updated").length;
  const totalErrors = results.filter((r) => r.status === "error").length;

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total processed: ${results.length}`);
  console.log(`Created: ${totalCreated}`);
  console.log(`Updated: ${totalUpdated}`);
  console.log(`Failed: ${totalErrors}`);

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
        const updatedCustomer = await updateCustomer(existingCustomer.id, row);
        return { status: "updated", email: row.email, id: updatedCustomer.id };
      } else {
        const newCustomer = await createCustomer(row);
        return { status: "created", email: row.email, id: newCustomer.id };
      }
    } catch (error) {
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
