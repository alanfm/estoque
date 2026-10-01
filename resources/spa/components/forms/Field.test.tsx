import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

describe("Field", () => {
  test("associa label, ajuda e erro ao controle", () => {
    render(
      <Field id="email" label="E-mail" hint="Use o e-mail institucional">
        <Input type="email" />
      </Field>,
    );

    const input = screen.getByLabelText(/^E-mail/);
    expect(input).toHaveAccessibleDescription("Use o e-mail institucional");
  });

  test("marca o controle como inválido e descreve o erro", () => {
    render(
      <Field id="email" label="E-mail" error="Informe um e-mail válido.">
        <Input type="email" />
      </Field>,
    );

    const input = screen.getByLabelText(/^E-mail/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Informe um e-mail válido.");
  });

  test("indica campo obrigatório", () => {
    render(
      <Field id="email" label="E-mail" required>
        <Input type="email" />
      </Field>,
    );

    expect(screen.getByLabelText(/E-mail/)).toBeRequired();
  });

  test("controles de formulário compartilham tokens visuais e foco", () => {
    const { container } = render(
      <>
        <Input aria-label="Texto" />
        <Select aria-label="Seleção" />
        <Textarea aria-label="Texto longo" />
      </>,
    );

    const controls = [...container.querySelectorAll("input, select, textarea")];
    for (const control of controls) {
      expect(control.className).toContain("border-line-strong");
      expect(control.className).toContain("bg-surface");
      expect(control.className).toContain("text-ink");
      expect(control.className).toContain("focus-visible:outline-focus");
    }
  });
});
