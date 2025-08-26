import { createUser, updateUser, getUser } from "@clients/user.fn.js";
import type { ImportRow } from "@utils/types/user.js";

export async function upsertUsers(rows: ImportRow[], chunkSize = 50) {
  const results: Array<{
    email: string;
    id?: number;
    status: "ok" | "fail";
    error?: string;
  }> = [];

  // Process in chunks
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    console.log(
      `Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(rows.length / chunkSize)} (${chunk.length} users)`
    );

    const chunkResults = await processChunk(chunk);

    console.log("Chunk results:", chunkResults);
    results.push(...chunkResults);

    // Brief pause between chunks to be nice to WordPress
    if (i + chunkSize < rows.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

async function processChunk(rows: ImportRow[]) {
  const out: Array<{
    email: string;
    id?: number;
    status: "ok" | "fail";
    error?: string;
  }> = [];
  const concurrency = 5;
  let i = 0;

  async function worker() {
    while (i < rows.length) {
      const row = rows[i++];
      try {
        const existing = await getUser(row!.email);
        const r = existing
          ? await updateUser(existing.id, row!)
          : await createUser(row!);
        out.push({ status: "ok", email: row!.email, id: r.id });
      } catch (e: unknown) {
        out.push({
          status: "fail",
          email: row!.email,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return out;
}
