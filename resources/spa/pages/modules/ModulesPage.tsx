import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/actions/Button";
import { Badge } from "../../components/data-display/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "../../components/data-display/Table";
import { Alert } from "../../components/feedback/Alert";
import { ErrorState } from "../../components/feedback/ErrorState";
import { Spinner } from "../../components/feedback/Spinner";
import { Input } from "../../components/forms/Input";
import { PageHeader } from "../../components/navigation/PageHeader";
import { ConfirmDialog } from "../../components/overlays/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../components/overlays/Dialog";
import { useAsync } from "../../hooks/useAsync";
import { can } from "../../lib/permissions";
import { useDocumentTitle } from "../../router/guards";
import { ApiError } from "../../services/api/errors";
import {
  modulesService,
  type InstalledModule,
} from "../../services/modules/modulesService";
import { useSession } from "../../stores/session/SessionContext";

export function ModulesPage() {
  useDocumentTitle("Módulos");
  const { state } = useSession();
  const loader = useCallback(
    (signal: AbortSignal) => modulesService.list(signal),
    [],
  );
  const { data, loading, error, reload } = useAsync(loader);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [target, setTarget] = useState<{
    module: InstalledModule;
    operation: "enable" | "disable" | "remove";
  } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ repository: string }>();

  const perform = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setFailure(null);
    setMessage(null);
    try {
      await action();
      setAdding(false);
      setTarget(null);
      reset();
      setMessage(
        success + " Recarregue a página para atualizar os menus dos módulos.",
      );
      reload();
    } catch (caught) {
      const fields =
        caught instanceof ApiError
          ? Object.values(caught.fieldErrors()).flat()
          : [];
      setFailure(
        fields.length
          ? fields.join(" ")
          : caught instanceof Error
            ? caught.message
            : "Não foi possível concluir a operação.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos"
        description="Gerencie os módulos instalados e sua compatibilidade com o núcleo."
        breadcrumbs={[
          { label: "Painel", to: "/" },
          { label: "Configurações" },
          { label: "Módulos" },
        ]}
        actions={
          can(state.user, "modules.install") ? (
            <Button
              disabled={busy || !data?.meta.managementEnabled}
              onClick={() => {
                setFailure(null);
                setAdding(true);
              }}
            >
              Adicionar módulo
            </Button>
          ) : null
        }
      />
      {message ? (
        <Alert variant="success">
          {message}{" "}
          <Button variant="ghost" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </Alert>
      ) : null}
      {failure && !adding ? <Alert variant="danger">{failure}</Alert> : null}
      {data && !data.meta.managementEnabled ? (
        <Alert>
          Este host usa implantação imutável. Faça alterações no ambiente de
          build e publique uma nova imagem.
        </Alert>
      ) : null}
      {data?.meta.issues.length ? (
        <Alert variant="danger">{data.meta.issues.join(" ")}</Alert>
      ) : null}
      {busy ? (
        <Alert>
          Operação em andamento. Aguarde a instalação e a compilação dos assets.
        </Alert>
      ) : null}
      {loading && !data ? (
        <Spinner label="Carregando módulos" />
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data ? (
        <>
          <p className="text-body-sm text-ink-secondary">
            Versão do núcleo: {data.meta.coreVersion}
          </p>
          {data.data.length === 0 ? (
            <p>Nenhum módulo instalado.</p>
          ) : (
            <TableWrapper>
              <Table>
                <caption className="sr-only">Módulos instalados</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Compatibilidade</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((module) => (
                    <TableRow key={module.name}>
                      <TableCell>
                        <strong>{module.displayName}</strong>
                        <div className="text-body-sm text-ink-secondary">
                          {module.name}
                        </div>
                        {module.issues.length ? (
                          <p className="text-danger-status">
                            {module.issues.join(" ")}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{module.version}</TableCell>
                      <TableCell>Núcleo {module.core}</TableCell>
                      <TableCell>
                        <Badge>
                          {module.enabled ? "Habilitado" : "Desabilitado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {can(
                            state.user,
                            module.enabled
                              ? "modules.disable"
                              : "modules.enable",
                          ) ? (
                            <Button
                              variant="secondary"
                              disabled={
                                busy ||
                                !data.meta.managementEnabled ||
                                (!module.enabled && module.issues.length > 0)
                              }
                              onClick={() => {
                                setFailure(null);
                                setTarget({
                                  module,
                                  operation: module.enabled
                                    ? "disable"
                                    : "enable",
                                });
                              }}
                            >
                              {module.enabled ? "Desabilitar" : "Habilitar"}
                            </Button>
                          ) : null}
                          {can(state.user, "modules.remove") ? (
                            <Button
                              variant="danger"
                              disabled={busy || !data.meta.managementEnabled}
                              onClick={() => {
                                setFailure(null);
                                setTarget({ module, operation: "remove" });
                              }}
                            >
                              Remover
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </>
      ) : null}
      <Dialog
        open={adding}
        onOpenChange={(open) => {
          if (!busy) setAdding(open);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <DialogTitle>Adicionar módulo</DialogTitle>
          <DialogDescription>
            Informe o repositório GitHub. A compatibilidade será verificada
            antes da instalação. O módulo será instalado desabilitado.
          </DialogDescription>
          <form
            className="mt-4 space-y-4"
            onSubmit={handleSubmit(({ repository }) =>
              perform(
                () => modulesService.install(repository),
                "Módulo instalado.",
              ),
            )}
          >
            <label htmlFor="module-repository">Link do módulo (GitHub)</label>
            <Input
              id="module-repository"
              type="url"
              placeholder="https://github.com/organizacao/modulo"
              disabled={busy}
              aria-invalid={Boolean(errors.repository)}
              aria-describedby={
                errors.repository ? "module-repository-error" : undefined
              }
              {...register("repository", {
                required: "Informe o link do módulo.",
                pattern: {
                  value:
                    /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/?$/,
                  message: "Informe o link HTTPS de um repositório GitHub.",
                },
              })}
            />
            {errors.repository ? (
              <p id="module-repository-error" role="alert">
                {errors.repository.message}
              </p>
            ) : null}
            {failure ? <Alert variant="danger">{failure}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setAdding(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Instalando…" : "Verificar e instalar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setTarget(null);
        }}
        title={
          target?.operation === "remove"
            ? "Remover módulo"
            : target?.operation === "enable"
              ? "Habilitar módulo"
              : "Desabilitar módulo"
        }
        description={
          target
            ? `${target.module.displayName}: ${target.operation === "remove" ? "o pacote será removido; os dados e os vínculos de permissão serão preservados." : target.operation === "enable" ? "a compatibilidade será validada, as migrations executadas e os assets recompilados." : "o acesso ao módulo será desativado e os dados preservados."}`
            : undefined
        }
        confirmLabel="Confirmar"
        destructive={target?.operation === "remove"}
        loading={busy}
        onConfirm={() => {
          if (target)
            void perform(
              () => modulesService[target.operation](target.module.name),
              "Operação concluída.",
            );
        }}
      />
    </div>
  );
}
