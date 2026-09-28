import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { Plugin } from "vite";

export interface DiscoveredModuleEntry {
  name: string;
  entry: string;
  manifestPath: string;
}

export interface DiscoverModulesOptions {
  roots: string[];
  statePath?: string;
}

interface Manifest {
  name?: unknown;
  frontendEntry?: unknown;
}

interface ModuleState {
  disabled?: unknown;
}

function parseJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function disabledModules(statePath?: string): Set<string> {
  if (!statePath || !existsSync(statePath)) {
    return new Set();
  }

  const state = parseJson<ModuleState>(statePath);
  const disabled = Array.isArray(state?.disabled) ? state?.disabled : [];

  return new Set(
    disabled.filter((name): name is string => typeof name === "string"),
  );
}

function listDirectories(path: string): string[] {
  try {
    return readdirSync(path).filter((name) =>
      statSync(join(path, name)).isDirectory(),
    );
  } catch {
    return [];
  }
}

/**
 * Descobre as entradas frontend dos módulos habilitados.
 *
 * Espelha a descoberta do núcleo (`modules/<vendor>/<name>/module.json`) e o
 * estado em `storage/app/modules.json`. Lança erro quando um módulo habilitado
 * declara uma entrada inexistente.
 */
export function discoverModuleEntries({
  roots,
  statePath,
}: DiscoverModulesOptions): DiscoveredModuleEntry[] {
  const disabled = disabledModules(statePath);
  const entries = new Map<string, DiscoveredModuleEntry>();

  for (const root of roots) {
    if (!existsSync(root)) {
      continue;
    }

    for (const vendor of listDirectories(root)) {
      for (const name of listDirectories(join(root, vendor))) {
        const manifestPath = join(root, vendor, name, "module.json");

        if (!existsSync(manifestPath)) {
          continue;
        }

        const manifest = parseJson<Manifest>(manifestPath);

        if (
          !manifest ||
          typeof manifest.name !== "string" ||
          typeof manifest.frontendEntry !== "string"
        ) {
          throw new Error(
            `Manifesto inválido em ${manifestPath}: "name" e "frontendEntry" são obrigatórios.`,
          );
        }

        if (disabled.has(manifest.name)) {
          continue;
        }

        const entry = isAbsolute(manifest.frontendEntry)
          ? manifest.frontendEntry
          : resolve(dirname(manifestPath), manifest.frontendEntry);

        if (!existsSync(entry)) {
          throw new Error(
            `Entrada frontend ausente para o módulo "${manifest.name}": ${entry}`,
          );
        }

        if (entries.has(manifest.name)) {
          throw new Error(
            `Identificador de módulo duplicado no build: "${manifest.name}".`,
          );
        }

        entries.set(manifest.name, {
          name: manifest.name,
          entry,
          manifestPath,
        });
      }
    }
  }

  return [...entries.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function renderModuleEntries(entries: DiscoveredModuleEntry[]): string {
  const lines = entries.map(
    (entry) =>
      `  { name: ${JSON.stringify(entry.name)}, load: () => import(${JSON.stringify(
        entry.entry,
      )}) },`,
  );

  return ["export const moduleEntries = [", ...lines, "];", ""].join("\n");
}

const VIRTUAL_ID = "virtual:starterkit-modules";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export interface ModulesPluginOptions {
  roots?: string[];
  statePath?: string;
}

/**
 * Plugin Vite que injeta as entradas React/TypeScript dos módulos habilitados
 * no bundle do host.
 */
export function modulesPlugin(options: ModulesPluginOptions = {}): Plugin {
  let roots = options.roots;
  let statePath = options.statePath;

  const resolveOptions = (root: string) => {
    roots = roots && roots.length > 0 ? roots : [resolve(root, "modules")];
    statePath = statePath ?? resolve(root, "storage/app/modules.json");
  };

  return {
    name: "starterkit-modules",
    configResolved(config) {
      resolveOptions(config.root);
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) {
        return null;
      }

      const entries = discoverModuleEntries({
        roots: roots ?? [],
        statePath,
      });

      return renderModuleEntries(entries);
    },
    configureServer(server) {
      const manifestGlobs = (roots ?? []).map(
        (root) => `${root}/*/*/module.json`,
      );

      server.watcher.add(
        [...manifestGlobs, statePath].filter((path): path is string =>
          Boolean(path),
        ),
      );
    },
    handleHotUpdate(context) {
      const isManifest = /module\.json$/.test(context.file);

      if (!isManifest && context.file !== statePath) {
        return undefined;
      }

      const module = context.server.moduleGraph.getModuleById(RESOLVED_ID);

      if (module) {
        context.server.moduleGraph.invalidateModule(module);
      }

      context.server.ws.send({ type: "full-reload" });

      return [];
    },
  };
}
