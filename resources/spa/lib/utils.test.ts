import { describe, expect, test } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  test("preserva o tamanho tipográfico junto da cor", () => {
    expect(cn("text-label text-brand-foreground")).toBe(
      "text-label text-brand-foreground",
    );
    expect(cn("text-body text-ink hover:text-brand-hover")).toBe(
      "text-body text-ink hover:text-brand-hover",
    );
  });
});
