import {
  Boxes,
  FileText,
  FolderKanban,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  ArrowLeftRight,
  ClipboardCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Boxes,
  ArrowLeftRight,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
};

/** Resolve ícones públicos para grupos de navegação de módulos. */
export function resolveModuleGroupIcon(name?: string): LucideIcon {
  return resolveModuleIcon(name) ?? FolderKanban;
}

/**
 * Resolve o ícone público de um item de navegação de módulo.
 *
 * Módulos usam apenas nomes da lista pública; nomes desconhecidos resultam em
 * nenhum ícone, sem quebrar a navegação.
 */
export function resolveModuleIcon(name?: string): LucideIcon | undefined {
  if (!name) {
    return undefined;
  }

  return icons[name];
}
