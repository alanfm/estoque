export interface SessionUser {
  id: number | string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  roles: string[];
  createdAt: string | null;
}

export interface Role {
  id: number | string;
  slug: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
  usersCount?: number;
  createdAt: string | null;
}

export interface Permission {
  name: string;
  module: string;
  description: string | null;
  obsolete: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  passwordConfirmation: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  roles: string[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roles?: string[];
}

export interface CreateRoleData {
  slug: string;
  name: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  permissions?: string[];
}
