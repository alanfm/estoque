import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderWithProviders } from "../../test/renderWithProviders";
import { authService } from "../../services/auth/authService";
import { usersService } from "../../services/users/usersService";
import { UsersListPage } from "./UsersListPage";

vi.mock("../../services/auth/authService", () => ({
  authService: {
    options: vi.fn(),
    currentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock("../../services/users/usersService", () => ({
  usersService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const mockedAuth = vi.mocked(authService);
const mockedUsers = vi.mocked(usersService);

const page = {
  data: [
    {
      id: 1,
      name: "Ana Souza",
      email: "ana@example.com",
      registry: null,
      ldapEnabled: false,
      localAuthEnabled: true,
      roles: ["admin"],
      createdAt: "2026-09-21T12:30:00Z",
    },
  ],
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    currentPage: 1,
    from: 1,
    lastPage: 1,
    perPage: 20,
    to: 1,
    total: 1,
  },
};

beforeEach(() => {
  mockedUsers.list.mockResolvedValue(page);
});

describe("UsersListPage", () => {
  test("lista usuários e oferece criação com permissão", async () => {
    mockedAuth.currentUser.mockResolvedValue({
      id: 9,
      name: "Admin",
      email: "admin@example.com",
      roles: ["super-admin"],
      permissions: ["users.viewAny", "users.create", "users.update"],
      isSuperAdmin: false,
    });

    renderWithProviders(<UsersListPage />, { route: "/admin/users" });

    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Criar usuário/ }),
    ).toBeInTheDocument();
  });

  test("esconde criação sem permissão", async () => {
    mockedAuth.currentUser.mockResolvedValue({
      id: 10,
      name: "Consulta",
      email: "consulta@example.com",
      roles: ["viewer"],
      permissions: ["users.viewAny"],
      isSuperAdmin: false,
    });

    renderWithProviders(<UsersListPage />, { route: "/admin/users" });

    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Criar usuário/ })).toBeNull();
  });
});
