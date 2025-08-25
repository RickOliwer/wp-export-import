import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  WP_SITE: z.string().regex(/^https?:\/\/.+/), // url() not working for some reason
  WP_USER: z.string().min(1),
  WP_APP_PASSWORD: z.string().min(10),
});

export const env = envSchema.parse(process.env);
