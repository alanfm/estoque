import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/overlays/Dialog";
import { useRoleOptions } from "../../hooks/useRoleOptions";
import { can } from "../../lib/permissions";
import { usersService } from "../../services/users/usersService";
import { useSession } from "../../stores/session/SessionContext";
import { UserForm } from "./UserForm";

export function UserCreateForm({
  onCancel,
  onSaved,
}: {
  onCancel(): void;
  onSaved(message: string): void;
}) {
  const { state } = useSession();
  const rolesAvailable = can(state.user, "roles.viewAny");
  const { roles, loading } = useRoleOptions(rolesAvailable);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Criar usuário</DialogTitle>
        <DialogDescription>
          Informe a matrícula para login e o e-mail de contato. Contas locais
          receberão por e-mail um link para definir a própria senha.
        </DialogDescription>
      </DialogHeader>

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
        onCancel={onCancel}
        roles={roles}
        rolesAvailable={rolesAvailable}
        rolesLoading={loading}
        onSubmit={async (values) => {
          await usersService.create(values);
          onSaved(
            values.localAuthEnabled
              ? "Usuário criado e link de definição da senha local enviado por e-mail."
              : "Usuário institucional criado.",
          );
        }}
      />
    </div>
  );
}
