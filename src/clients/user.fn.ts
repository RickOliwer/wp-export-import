import type {
  CreateUserPayload,
  UpdateUserPayload,
  WordPressUser,
} from "@utils/types/wordpress.js";
import { wp } from "./wordpress.client.js";
import type { ImportRow } from "@utils/types/user.js";
import { buildMeta, buildPasswordFromName, randPass } from "@utils/index.js";
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
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    password: row.password ?? buildPasswordFromName(row.email),
    roles: row.roles ?? ["customer"],
    meta: buildMeta(row),
  };

  if (row.first_name) payload.first_name = row.first_name;
  if (row.last_name) payload.last_name = row.last_name;

  // Set locale from meta if available (Swedish customers)
  if (row.meta?.locale && typeof row.meta.locale === "string") {
    payload.locale = row.meta.locale;
  }

  const displayName = [row.first_name, row.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (displayName) payload.name = displayName;

  const result = await wp<WordPressUser>("/wp-json/wp/v2/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result;
}

async function updateUser(id: number, row: ImportRow) {
  const payload: UpdateUserPayload = {
    roles: row.roles ?? ["customer"],
    meta: buildMeta(row), // This was missing!
  };

  if (row.first_name) payload.first_name = row.first_name;
  if (row.last_name) payload.last_name = row.last_name;
  if (row.password) payload.password = row.password;

  // Set locale from meta if available
  if (row.meta?.locale && typeof row.meta.locale === "string") {
    payload.locale = row.meta.locale;
  }

  const displayName = [row.first_name, row.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (displayName) payload.name = displayName;

  return wp<WordPressUser>(`/wp-json/wp/v2/users/${id}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export { getUser, createUser, updateUser };
