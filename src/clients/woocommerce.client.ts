import { env } from "config/index.js";

const WC_AUTH = `Basic ${Buffer.from(`${env.WC_CONSUMER_KEY}:${env.WC_CONSUMER_SECRET}`).toString("base64")}`;

async function wc<T>(path: string, init?: RequestInit): Promise<T> {
  console.log("🔧 WooCommerce API Debug:");
  console.log("  Site URL:", env.WP_SITE);
  console.log("  Full URL:", `${env.WP_SITE}${path}`);
  console.log(
    "  Consumer Key:",
    env.WC_CONSUMER_KEY
      ? `${env.WC_CONSUMER_KEY.substring(0, 15)}...`
      : "❌ MISSING"
  );
  console.log(
    "  Consumer Secret:",
    env.WC_CONSUMER_SECRET
      ? `${env.WC_CONSUMER_SECRET.substring(0, 15)}...`
      : "❌ MISSING"
  );
  console.log("  Auth Header:", WC_AUTH.substring(0, 30) + "...");
  console.log("  Method:", init?.method || "GET");

  const res = await fetch(`${env.WP_SITE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: WC_AUTH,
      ...(init?.headers || {}),
    },
  });

  console.log("📡 WooCommerce API Response:");
  console.log("  Status:", res.status, res.statusText);
  console.log("  Headers:", Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const errorText = await res.text();
    console.log("❌ Error Response Body:", errorText);
    throw new Error(`${res.status} ${res.statusText}: ${errorText}`);
  }

  const result = await res.json();
  console.log("✅ Success Response:", JSON.stringify(result, null, 2));

  return result as Promise<T>;
}

export { wc };
