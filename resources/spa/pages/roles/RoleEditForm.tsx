import { useCallback } from "react";
import { ErrorState } from "../../components/feedback/ErrorState";
import { Spinner } from "../../components/feedback/Spinner";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/overlays/Dialog";
import { useAsync } from "../../hooks/useAsync";
import { usePermissionOptions } from "../../hooks/usePermissionOptions";
import { can } from "../../lib/permissions";
import { rolesService } from "../../services/roles/rolesService";
import { useSession } from "../../stores/session/SessionContext";
import { RoleForm } from "./RoleForm";

export function RoleEditForm({
  id,
  onCancel,
  onSaved,
}: {
  id: string;
  onCancel(): void;
  onSaved(message: string): void;
}) {
  const { state } = useSession();
  const permissionsAvailable = can(state.user, "permissions.viewAny");
  const { permissions, loading: permissionsLoading } =
    usePermissionOptions(permissionsAvailable);

  const loader = useCallback(
    (signal: AbortSignal) => rolesService.get(id, signal),
    [id],
  );
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Editar papel</DialogTitle>
        <DialogDescription>
          Atualize o nome e as permissões do papel.
        </DialogDescription>
      </DialogHeader>

      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando papel" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data ? (
        <RoleForm
          defaultValues={{
            slug: data.slug,
            name: data.name,
            permissions: data.permissions,
          }}
          submitLabel="Salvar alterações"
          onCancel={onCancel}
          permissions={permissions}
          permissionsAvailable={permissionsAvailable}
          permissionsLoading={permissionsLoading}
          slugReadOnly
          disabled={data.isSystem}
          disabledNotice={
            data.isSystem
              ? "Este papel é o superadministrador e não pode ser editado pela interface."
              : undefined
          }
          onSubmit={async (values) => {
            await rolesService.update(id, {
              name: values.name,
              permissions: values.permissions,
            });
            onSaved("Papel atualizado.");
          }}
        />
      ) : null}
    </div>
  );
}
