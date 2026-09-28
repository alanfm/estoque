import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  test("renderiza com rótulo acessível", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  test("estado de carregamento desabilita e anuncia", () => {
    render(<Button loading>Salvar</Button>);
    const button = screen.getByRole("button", { name: "Salvar" });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  test("asChild preserva o elemento semântico", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/destino">Ir</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "Ir" })).toHaveAttribute(
      "href",
      "/destino",
    );
  });
});
