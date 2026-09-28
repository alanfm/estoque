import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "../services/api/errors";

export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string | null {
  if (error instanceof Error && error.name === "AbortError") {
    return null;
  }

  if (error instanceof ApiError) {
    const fields = error.fieldErrors();
    let mapped = false;

    for (const [name, messages] of Object.entries(fields)) {
      if (messages.length > 0) {
        setError(name as Path<T>, {
          type: "server",
          message: messages[0],
        });
        mapped = true;
      }
    }

    return mapped ? null : error.message;
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
}
