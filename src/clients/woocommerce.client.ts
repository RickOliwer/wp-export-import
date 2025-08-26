import { env } from "config/index.js";

const WC_AUTH = `Basic ${Buffer.from(`${env.WC_CONSUMER_KEY}:${env.WC_CONSUMER_SECRET}`).toString("base64")}`;

async function wc<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.WP_SITE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: WC_AUTH,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${errorText}`);
  }

  const result = await res.json();

  return result as Promise<T>;
}

export { wc };
