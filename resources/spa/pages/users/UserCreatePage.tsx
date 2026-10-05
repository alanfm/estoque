import { FormModal } from "../../components/overlays/FormModal";
import { UsersListPage } from "./UsersListPage";
import { useNavigate } from "react-router";
import { useRoleOptions } from "../../hooks/useRoleOptions";
import { can } from "../../lib/permissions";
import { useDocumentTitle } from "../../router/guards";
import { usersService } from "../../services/users/usersService";
import { useSession } from "../../stores/session/SessionContext";
import { UserForm } from "./UserForm";

export function UserCreatePage() {
  useDocumentTitle("Criar usuário");
  const navigate = useNavigate();
  const { state } = useSession();
  const rolesAvailable = can(state.user, "roles.viewAny");
  const { roles, loading } = useRoleOptions(rolesAvailable);

  return (
    <FormModal
      title="Criar usuário"
      returnTo="/admin/users"
      background={<UsersListPage />}
      backgroundPermission="users.viewAny"
      description="Informe a matrícula para login e o e-mail de contato. Contas locais receberão por e-mail um link para definir a própria senha."
    >
      <UserForm
        defaultValues={{
          name: "",
          email: "",
          registry: "",
          ldapEnabled: false,
          localAuthEnabled: true,
          roles: [],
        }}
        submitLabel="Criar usuário"
        cancelTo="/admin/users"
        roles={roles}
        rolesAvailable={rolesAvailable}
        rolesLoading={loading}
        onSubmit={async (values) => {
          await usersService.create(values);
          navigate("/admin/users", {
            replace: true,
            state: {
              flash: values.localAuthEnabled
                ? "Usuário criado e link de definição da senha local enviado por e-mail."
                : "Usuário institucional criado.",
            },
          });
        }}
      />
    </FormModal>
  );
}
