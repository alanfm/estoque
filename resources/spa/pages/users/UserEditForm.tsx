import { useCallback } from "react";
import { ErrorState } from "../../components/feedback/ErrorState";
import { Spinner } from "../../components/feedback/Spinner";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/overlays/Dialog";
import { useAsync } from "../../hooks/useAsync";
import { useRoleOptions } from "../../hooks/useRoleOptions";
import { can } from "../../lib/permissions";
import { usersService } from "../../services/users/usersService";
import { useSession } from "../../stores/session/SessionContext";
import { UserForm } from "./UserForm";

export function UserEditForm({
  id,
  onCancel,
  onSaved,
}: {
  id: string;
  onCancel(): void;
  onSaved(message: string): void;
}) {
  const { state } = useSession();
  const rolesAvailable = can(state.user, "roles.viewAny");
  const { roles, loading: rolesLoading } = useRoleOptions(rolesAvailable);

  const loader = useCallback(
    (signal: AbortSignal) => usersService.get(id, signal),
    [id],
  );
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Editar usuário</DialogTitle>
        <DialogDescription>
          Atualize os dados e os papéis da conta.
        </DialogDescription>
      </DialogHeader>

      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando usuário" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data ? (
        <UserForm
          defaultValues={{
            name: data.name,
            email: data.email,
            registry: data.registry ?? "",
            ldapEnabled: data.ldapEnabled,
            localAuthEnabled: data.localAuthEnabled,
            roles: data.roles,
          }}
          submitLabel="Salvar alterações"
          dataLocked={data.accountSource === "ldap"}
          onCancel={onCancel}
          roles={roles}
          rolesAvailable={rolesAvailable}
          rolesLoading={rolesLoading}
          onSubmit={async (values) => {
            await usersService.update(
              id,
              data.accountSource === "ldap" ? { roles: values.roles } : values,
            );
            onSaved("Usuário atualizado.");
          }}
        />
      ) : null}
    </div>
  );
}
