import { z } from "zod";

const address = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const importRowSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  roles: z.array(z.string()).optional(),
  um_role: z.string().optional(),
  meta: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  wc_billing: address.optional(),
  wc_shipping: address.optional(),
});

export const importRowsSchema = z.object({
  rows: z.array(importRowSchema).min(1),
});
