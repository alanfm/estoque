import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  test("usa role status para avisos não críticos", () => {
    render(<Alert variant="info">Aviso</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Aviso");
  });

  test("usa role alert para erro", () => {
    render(
      <Alert variant="danger" title="Falha">
        Não foi possível salvar.
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Falha");
    expect(alert).toHaveTextContent("Não foi possível salvar.");
  });
});
