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
export type {
  ApiErrorBody,
  ApiResource,
  ListQuery,
  Paginated,
  PaginationLinks,
  PaginationMeta,
  ValidationErrorDetails,
} from "../types/api";
export type {
  QueryValue,
  RequestOptions as ApiRequestOptions,
} from "../services/api/client";

export { apiDownload, apiRequest } from "../services/api/client";
export { ApiError } from "../services/api/errors";
export type { ApiErrorKind } from "../services/api/errors";
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
