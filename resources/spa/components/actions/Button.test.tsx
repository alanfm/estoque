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

  test("variantes compartilham a anatomia e trocam só os tokens", () => {
    const { rerender } = render(<Button variant="primary">Ação</Button>);
    const button = screen.getByRole("button", { name: "Ação" });

    expect(button.className).toContain("h-10");
    expect(button.className).toContain("rounded-md");
    expect(button.className).toContain("text-label");
    expect(button.className).toContain("bg-brand");
    expect(button.className).toContain("text-brand-foreground");

    rerender(<Button variant="secondary">Ação</Button>);
    expect(button.className).toContain("bg-surface");
    expect(button.className).toContain("border-line-strong");
    expect(button.className).toContain("text-ink");

    rerender(
      <Button variant="ghost" size="iconCompact">
        Ação
      </Button>,
    );
    expect(button.className).toContain("bg-transparent");
    expect(button.className).toContain("border-transparent");
    expect(button.className).toContain("size-8");

    rerender(<Button variant="danger">Ação</Button>);
    expect(button.className).toContain("bg-danger");
    expect(button.className).toContain("text-danger-foreground");

    rerender(
      <Button variant="link" disabled>
        Ação
      </Button>,
    );
    expect(button.className).toContain("underline");
    expect(button.className).toContain("disabled:bg-transparent");
    expect(button.className).toContain("disabled:no-underline");
    expect(button).toBeDisabled();
  });
});
