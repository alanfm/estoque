import { ServerCrash } from "lucide-react";
import { Button } from "../actions/Button";

export function ErrorState({
  title = "Não foi possível carregar",
  message = "Ocorreu um erro ao buscar os dados. Tente novamente.",
  requestId,
  onRetry,
}: {
  title?: string;
  message?: string;
  requestId?: string | null;
  onRetry?(): void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-danger-status bg-danger-status-surface p-10 text-center text-danger-status"
    >
      <ServerCrash className="size-8" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-h3">{title}</p>
        <p className="text-body-sm">{message}</p>
        {requestId ? (
          <p className="text-caption">
            Código da requisição: <span className="font-mono">{requestId}</span>
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
