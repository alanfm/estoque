import { describe, expect, test, vi } from "vitest";
import { applyApiError } from "./formErrors";
import { ApiError } from "../services/api/errors";

describe("applyApiError", () => {
  test("mapeia erros de validação para os campos", () => {
    const setError = vi.fn();
    const error = new ApiError({
      status: 422,
      code: "VALIDATION_FAILED",
      message: "Os dados informados são inválidos.",
      details: { fields: { email: ["E-mail inválido."] } },
    });

    const message = applyApiError(error, setError);

    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "E-mail inválido.",
    });
    expect(message).toBeNull();
  });

  test("retorna mensagem geral quando não há campos mapeados", () => {
    const setError = vi.fn();
    const error = new ApiError({
      status: 409,
      code: "CONFLICT",
      message: "Operação não permitida.",
    });

    expect(applyApiError(error, setError)).toBe("Operação não permitida.");
    expect(setError).not.toHaveBeenCalled();
  });

  test("ignora cancelamento de requisição", () => {
    const setError = vi.fn();
    const abort = new Error("aborted");
    abort.name = "AbortError";

    expect(applyApiError(abort, setError)).toBeNull();
    expect(setError).not.toHaveBeenCalled();
  });

  test("retorna mensagem genérica para erro desconhecido", () => {
    const setError = vi.fn();

    expect(applyApiError(new Error("boom"), setError)).toBe(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
