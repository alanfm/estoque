import { moduleEntries } from "virtual:starterkit-modules";
import { createModuleRegistry } from "./registry";
import type { ModuleEntry } from "./types";

/**
 * Carrega a extensão frontend dos módulos injetados pelo plugin Vite do host.
 */
export function loadModuleRegistry() {
  return createModuleRegistry((moduleEntries ?? []) as ModuleEntry[]);
}
