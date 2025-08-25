import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  WP_SITE: z.string().url(),
  WP_USER: z.string().min(1),
  WP_APP_PASSWORD: z.string().min(10),
});

export const env = envSchema.parse(process.env);
