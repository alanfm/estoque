import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { apiRequest } from "./client";
import { ApiError } from "./errors";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  test("retorna o corpo em sucesso", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(jsonResponse({ data: { status: "ok" } })),
        ),
    );

    await expect(apiRequest("/system/status")).resolves.toEqual({
      data: { status: "ok" },
    });
  });

  test("retorna undefined em 204", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response(null, { status: 204 })),
        ),
    );

    await expect(
      apiRequest("/auth/logout", { method: "POST" }),
    ).resolves.toBeUndefined();
  });

  test("normaliza erro 422 com campos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse(
            {
              error: {
                code: "VALIDATION_FAILED",
                message: "Os dados informados são inválidos.",
                details: { fields: { email: ["Informe um e-mail válido."] } },
                requestId: "01K",
              },
            },
            422,
          ),
        ),
      ),
    );

    await expect(
      apiRequest("/auth/login", { method: "POST" }),
    ).rejects.toMatchObject({
      kind: "validation",
      status: 422,
      requestId: "01K",
    });

    try {
      await apiRequest("/auth/login", { method: "POST" });
    } catch (error) {
      expect((error as ApiError).fieldErrors()).toEqual({
        email: ["Informe um e-mail válido."],
      });
    }
  });

  test("normaliza erro 500 sem envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response("erro interno", { status: 500 })),
        ),
    );

    await expect(apiRequest("/system/status")).rejects.toMatchObject({
      kind: "server",
      code: "INTERNAL_ERROR",
    });
  });

  test("envia X-XSRF-TOKEN em requisições de escrita", async () => {
    document.cookie = "XSRF-TOKEN=token-value";
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse({ data: {} })));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "a@b.c" },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/v1/auth/login");
    expect(init.credentials).toBe("same-origin");
    expect((init.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe(
      "token-value",
    );
  });

  test("emite evento em 401", async () => {
    const listener = vi.fn();
    window.addEventListener("auth:unauthorized", listener);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse(
            {
              error: {
                code: "UNAUTHENTICATED",
                message: "Sessão expirada.",
                details: null,
                requestId: "01K",
              },
            },
            401,
          ),
        ),
      ),
    );

    await expect(apiRequest("/auth/user")).rejects.toMatchObject({
      kind: "unauthorized",
    });
    expect(listener).toHaveBeenCalledOnce();

    window.removeEventListener("auth:unauthorized", listener);
  });
});
