export interface WordPressUser {
  id: number;
  username: string;
  email: string;
  name: string;
  roles: string[];
  meta: Record<string, string>;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  name: string;
  roles: string[];
  meta: Record<string, string>;
}

export interface UpdateUserPayload {
  name: string;
  roles: string[];
  meta: Record<string, string>;
  password?: string;
}
