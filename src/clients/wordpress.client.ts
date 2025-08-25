import { env } from "config/index.js";

const AUTH = `Basic ${Buffer.from(`${env.WP_USER}:${env.WP_APP_PASSWORD}`).toString("base64")}`;

async function wp<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.WP_SITE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export { wp };
