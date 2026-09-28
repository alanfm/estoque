import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  discoverModuleEntries,
  renderModuleEntries,
} from "../../../build/modules-vite-plugin";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, "../../../tests/Fixtures/Modules");
const temporaryDirectories: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "starterkit-vite-modules-"));
  temporaryDirectories.push(root);

  return root;
}

function writeModule(
  root: string,
  vendor: string,
  name: string,
  manifest: Record<string, unknown>,
): void {
  const path = join(root, vendor, name);
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, "module.json"), JSON.stringify(manifest));
}

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();

    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe("discoverModuleEntries", () => {
  it("discovers enabled module frontend entries", () => {
    const entries = discoverModuleEntries({ roots: [fixtures] });

    expect(entries.map((entry) => entry.name)).toEqual(["contract-sample"]);
    expect(entries[0]?.entry.endsWith("resources/spa/module.ts")).toBe(true);
  });

  it("skips modules disabled in the state file", () => {
    const root = temporaryRoot();
    const statePath = join(root, "modules.json");

    writeModule(root, "starterkit", "contract-sample", {
      name: "contract-sample",
      frontendEntry: "resources/spa/module.ts",
    });
    mkdirSync(join(root, "starterkit", "contract-sample", "resources/spa"), {
      recursive: true,
    });
    writeFileSync(
      join(root, "starterkit", "contract-sample", "resources/spa/module.ts"),
      "export default {};",
    );
    writeFileSync(statePath, JSON.stringify({ disabled: ["contract-sample"] }));

    expect(discoverModuleEntries({ roots: [root], statePath })).toEqual([]);
  });

  it("fails when an enabled module is missing its frontend entry", () => {
    const root = temporaryRoot();
    writeModule(root, "starterkit", "broken", {
      name: "broken",
      frontendEntry: "resources/spa/module.ts",
    });

    expect(() => discoverModuleEntries({ roots: [root] })).toThrow(
      /Entrada frontend ausente/,
    );
  });

  it("fails on duplicate identifiers", () => {
    const root = temporaryRoot();

    for (const vendor of ["acme", "globex"]) {
      writeModule(root, vendor, "sample", {
        name: "sample",
        frontendEntry: "module.ts",
      });
      writeFileSync(
        join(root, vendor, "sample", "module.ts"),
        "export default {};",
      );
    }

    expect(() => discoverModuleEntries({ roots: [root] })).toThrow(/duplicado/);
  });

  it("renders dynamic imports for the host bundle", () => {
    const code = renderModuleEntries([
      {
        name: "sample",
        entry: "/tmp/module.ts",
        manifestPath: "/tmp/module.json",
      },
    ]);

    expect(code).toContain('name: "sample"');
    expect(code).toContain("() => import");
  });
});
