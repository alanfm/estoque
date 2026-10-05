import type { RouteObject } from "react-router";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { PublicLayout } from "../layouts/PublicLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ChangePasswordPage } from "../pages/auth/ChangePasswordPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { ForbiddenPage } from "../pages/errors/ForbiddenPage";
import { NotFoundPage } from "../pages/errors/NotFoundPage";
import { RoleCreatePage } from "../pages/roles/RoleCreatePage";
import { RoleEditPage } from "../pages/roles/RoleEditPage";
import { RolesListPage } from "../pages/roles/RolesListPage";
import { UserCreatePage } from "../pages/users/UserCreatePage";
import { UserEditPage } from "../pages/users/UserEditPage";
import { UsersListPage } from "../pages/users/UsersListPage";
import { RootRoute } from "./RootRoute";
import { RequireAuth, RequireGuest, RequirePermission } from "./guards";

export function createRoutes(moduleRoutes: RouteObject[] = []): RouteObject[] {
  return [
    {
      element: <RootRoute />,
      children: [
        {
          element: <RequireGuest />,
          children: [
            {
              element: <AuthLayout />,
              children: [
                { path: "login", element: <LoginPage /> },
                { path: "forgot-password", element: <ForgotPasswordPage /> },
                { path: "reset-password", element: <ResetPasswordPage /> },
              ],
            },
          ],
        },
        {
          element: <RequireAuth />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { index: true, element: <DashboardPage /> },
                { path: "password", element: <ChangePasswordPage /> },
                { path: "profile", element: <ProfilePage /> },
                {
                  element: <RequirePermission permission="users.viewAny" />,
                  children: [
                    { path: "admin/users", element: <UsersListPage /> },
                  ],
                },
                {
                  element: <RequirePermission permission="users.create" />,
                  children: [
                    { path: "admin/users/new", element: <UserCreatePage /> },
                  ],
                },
                {
                  element: <RequirePermission permission="users.view" />,
                  children: [
                    { path: "admin/users/:id", element: <UserEditPage /> },
                  ],
                },
                {
                  element: <RequirePermission permission="roles.viewAny" />,
                  children: [
                    { path: "admin/roles", element: <RolesListPage /> },
                  ],
                },
                {
                  element: <RequirePermission permission="roles.create" />,
                  children: [
                    { path: "admin/roles/new", element: <RoleCreatePage /> },
                  ],
                },
                {
                  element: <RequirePermission permission="roles.view" />,
                  children: [
                    { path: "admin/roles/:id", element: <RoleEditPage /> },
                  ],
                },
                ...moduleRoutes,
              ],
            },
          ],
        },
        {
          element: <PublicLayout />,
          children: [
            { path: "403", element: <ForbiddenPage /> },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}
