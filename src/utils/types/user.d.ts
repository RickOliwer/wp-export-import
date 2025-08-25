export type Address = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  state?: string;
  email?: string;
  phone?: string;
};

export type ImportRow = {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  roles?: string[]; // ["customer","organization"]
  um_role?: string; // UM role slug
  meta?: Record<string, string | number | boolean>;
  wc_billing?: Address;
  wc_shipping?: Address;
};
