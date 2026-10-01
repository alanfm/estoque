/**
 * Superfície pública do núcleo para o frontend dos módulos.
 *
 * Módulos compilados pelo host importam daqui. Nada além do que é exportado
 * neste arquivo é contrato público.
 */
export type {
  FrontendModule,
  ModuleContext,
  ModuleNavigationGroup,
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
export { Badge } from "../components/data-display/Badge";
export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "../components/data-display/Table";
export { Pagination } from "../components/navigation/Pagination";
export { SimpleTooltip } from "../components/overlays/Tooltip";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/overlays/Dialog";
export { useAsync } from "../hooks/useAsync";
export { can } from "../lib/permissions";
export { Alert } from "../components/feedback/Alert";
export { EmptyState } from "../components/feedback/EmptyState";
export { ErrorState } from "../components/feedback/ErrorState";
export { Spinner } from "../components/feedback/Spinner";
export { Field } from "../components/forms/Field";
export { Input } from "../components/forms/Input";
export { Select } from "../components/forms/Select";
export { Textarea } from "../components/forms/Textarea";
export { PageHeader } from "../components/navigation/PageHeader";
export { useSession } from "../stores/session/SessionContext";
