export interface SessionUser {
  id: number | string;
  name: string;
  email: string;
  registry?: string | null;
  accountSource?: "local" | "ldap";
  ldapSyncedAt?: string | null;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  authentication?: {
    provider: "local" | "ldap";
    canChangeLocalPassword: boolean;
  };
}

export interface User {
  id: number | string;
  name: string;
  email: string;
  registry: string | null;
  accountSource?: "local" | "ldap";
  ldapEnabled: boolean;
  localAuthEnabled: boolean;
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
  provider?: "auto" | "local" | "ldap";
  registry: string;
  password: string;
}

export interface AuthOptions {
  localEnabled: boolean;
  ldapEnabled: boolean;
  ldapLabel: string;
  ldapPasswordHelpUrl: string | null;
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
  registry: string;
  roles: string[];
  ldapEnabled?: boolean;
  localAuthEnabled?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  roles?: string[];
  registry?: string | null;
  ldapEnabled?: boolean;
  localAuthEnabled?: boolean;
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
