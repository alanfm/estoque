import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { FormModal } from "./FormModal";

vi.mock("../../stores/session/SessionContext", () => ({
  useSession: () => ({ state: { user: { permissions: ["items.viewAny"] } } }),
}));

function showForm(backgroundPermission = "items.viewAny") {
  render(
    <MemoryRouter initialEntries={["/items/new"]}>
      <Routes>
        <Route path="/items" element={<h1>Lista de itens</h1>} />
        <Route
          path="/items/new"
          element={
            <FormModal
              title="Novo item"
              returnTo="/items"
              background={<p>Itens existentes</p>}
              backgroundPermission={backgroundPermission}
            >
              <label>
                Nome
                <input name="name" />
              </label>
            </FormModal>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("FormModal", () => {
  test("abre diretamente pela URL com nome acessível e foco no formulário", () => {
    showForm();
    expect(screen.getByRole("dialog", { name: "Novo item" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveFocus();
    expect(screen.getByText("Itens existentes")).toBeInTheDocument();
  });

  test.each(["Fechar", "escape"])(
    "fecha por %s e retorna à listagem",
    (action) => {
      showForm();
      if (action === "escape")
        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      else
        fireEvent.click(screen.getAllByRole("button", { name: "Fechar" })[0]);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Lista de itens" }),
      ).toBeVisible();
    },
  );

  test("não monta a listagem sem sua permissão específica", () => {
    showForm("restricted.viewAny");
    expect(screen.queryByText("Itens existentes")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Novo item" })).toBeVisible();
  });
});
