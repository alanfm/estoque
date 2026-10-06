import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { RoleForm } from "./RoleForm";

test("mantém permissões selecionadas ao recolher um módulo", async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <RoleForm
      defaultValues={{ slug: "editor", name: "Editor", permissions: [] }}
      submitLabel="Salvar"
      onCancel={vi.fn()}
      permissionsAvailable
      permissionsLoading={false}
      permissions={[
        {
          name: "customers.create",
          module: "customers",
          description: "Criar clientes",
          obsolete: false,
        },
      ]}
      onSubmit={onSubmit}
    />,
  );
  const section = screen.getByText("customers (1)").closest("details")!;
  expect(section.open).toBe(false);
  await userEvent.click(screen.getByText("customers (1)"));
  expect(section.open).toBe(true);
  await userEvent.click(
    screen.getByRole("checkbox", { name: /customers.create/ }),
  );
  await userEvent.click(screen.getByText("customers (1)"));
  expect(section.open).toBe(false);
  fireEvent.submit(
    screen.getByRole("button", { name: "Salvar" }).closest("form")!,
  );
  await vi.waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      slug: "editor",
      name: "Editor",
      permissions: ["customers.create"],
    }),
  );
});
