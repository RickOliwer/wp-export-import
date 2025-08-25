import type { ImportRow } from "../types/user.js";
import type {
  WordPressUser,
  CreateUserPayload,
  UpdateUserPayload,
} from "../types/wordpress.js";
import { env } from "../config/index.js";
import { HttpError } from "../utils/httpError.js";

const AUTH =
  "Basic " +
  Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString("base64");

async function wp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.WP_SITE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new HttpError(
      res.status,
      `WP REST error: ${res.status} ${res.statusText}`,
      text
    );
  }
  return (await res.json()) as T;
}

export async function findUserByEmail(
  email: string
): Promise<WordPressUser | undefined> {
  const url = new URL("/wp-json/wp/v2/users", env.WP_SITE);
  url.searchParams.set("search", email);
  const arr = await wp<WordPressUser[]>(
    url.pathname + "?" + url.searchParams.toString(),
    { method: "GET" }
  );
  return arr.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

function buildMeta(row: ImportRow) {
  const meta: Record<string, string> = {
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
  };
  if (row.um_role) meta["um_role"] = row.um_role;
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

export async function createUser(row: ImportRow): Promise<WordPressUser> {
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

export async function updateUser(
  id: number,
  row: ImportRow
): Promise<WordPressUser> {
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
