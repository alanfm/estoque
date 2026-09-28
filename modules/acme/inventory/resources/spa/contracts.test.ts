import {
  ApiError,
  apiDownload,
  apiRequest,
  type ApiRequestOptions,
  type ApiResource,
} from "@starterkit/module-kit";
import { describe, expect, test } from "vitest";

describe("public module HTTP contract", () => {
  test("exports the shared API client and response contracts", () => {
    const options: ApiRequestOptions = {
      headers: { "Idempotency-Key": "op-1" },
    };
    const resource: ApiResource<{ id: string }> = { data: { id: "1" } };

    expect(options.headers).toBeDefined();
    expect(resource.data.id).toBe("1");
    expect(apiRequest).toBeTypeOf("function");
    expect(apiDownload).toBeTypeOf("function");
    expect(ApiError).toBeTypeOf("function");
  });
});
