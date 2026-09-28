/**
 * Superfície pública do núcleo para o frontend dos módulos.
 *
 * Módulos compilados pelo host importam daqui. Nada além do que é exportado
 * neste arquivo é contrato público.
 */
export type {
  FrontendModule,
  ModuleContext,
  ModuleNavigationItem,
  ModuleRoute,
} from "../modules/types";

export { Button } from "../components/actions/Button";
export { Card } from "../components/data-display/Card";
export { Alert } from "../components/feedback/Alert";
export { EmptyState } from "../components/feedback/EmptyState";
export { ErrorState } from "../components/feedback/ErrorState";
export { Spinner } from "../components/feedback/Spinner";
export { Field } from "../components/forms/Field";
export { Input } from "../components/forms/Input";
export { PageHeader } from "../components/navigation/PageHeader";
export { useSession } from "../stores/session/SessionContext";
