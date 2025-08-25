import type {
  CreateUserPayload,
  UpdateUserPayload,
  WordPressUser,
} from "@utils/types/wordpress.js";
import { wp } from "./wordpress.client.js";
import type { ImportRow } from "@utils/types/user.js";
import { buildMeta, randPass } from "@utils/index.js";
import { env } from "config/index.js";

async function getUser(email: string) {
  const url = new URL("/wp-json/wp/v2/users", env.WP_SITE);
  url.searchParams.set("search", email);
  const arr = await wp<WordPressUser[]>(
    url.pathname + "?" + url.searchParams.toString(),
    { method: "GET" }
  );
  return arr.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}
async function createUser(row: ImportRow) {
  if (!row.email) throw new Error("Email is required");
  const payload: CreateUserPayload = {
    username: row.username ?? row.email.split("@")[0] ?? "user",
    email: row.email,
    password: row.password ?? randPass(),
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
    roles: row.roles ?? ["customer"],
    meta: buildMeta(row),
  };
  return wp<WordPressUser>("/wp-json/wp/v2/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateUser(id: number, row: ImportRow) {
  const payload: UpdateUserPayload = {
    name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim(),
    roles: row.roles ?? ["customer"],
    meta: buildMeta(row),
  };
  if (row.password) payload.password = row.password;
  return wp<WordPressUser>(`/wp-json/wp/v2/users/${id}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { getUser, createUser, updateUser };
