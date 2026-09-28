import {
  Boxes,
  FileText,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  Boxes,
  FileText,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
};

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
