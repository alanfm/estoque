import { FormModal } from "../../components/overlays/FormModal";
import { UsersListPage } from "./UsersListPage";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ErrorState } from "../../components/feedback/ErrorState";
import { Spinner } from "../../components/feedback/Spinner";
import { useAsync } from "../../hooks/useAsync";
import { useRoleOptions } from "../../hooks/useRoleOptions";
import { can } from "../../lib/permissions";
import { useDocumentTitle } from "../../router/guards";
import { usersService } from "../../services/users/usersService";
import { useSession } from "../../stores/session/SessionContext";
import { UserForm } from "./UserForm";

export function UserEditPage() {
  useDocumentTitle("Editar usuário");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();
  const rolesAvailable = can(state.user, "roles.viewAny");
  const { roles, loading: rolesLoading } = useRoleOptions(rolesAvailable);

  const loader = useCallback(
    (signal: AbortSignal) => usersService.get(id, signal),
    [id],
  );
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <FormModal
      title="Editar usuário"
      returnTo="/admin/users"
      background={<UsersListPage />}
      backgroundPermission="users.viewAny"
      description="Atualize os dados e os papéis da conta."
    >
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
          cancelTo="/admin/users"
          roles={roles}
          rolesAvailable={rolesAvailable}
          rolesLoading={rolesLoading}
          onSubmit={async (values) => {
            await usersService.update(
              id,
              data.accountSource === "ldap" ? { roles: values.roles } : values,
            );
            navigate("/admin/users", {
              replace: true,
              state: { flash: "Usuário atualizado." },
            });
          }}
        />
      ) : null}
    </FormModal>
  );
}
