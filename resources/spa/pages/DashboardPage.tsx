import { Link } from "react-router";
import { ShieldCheck, Users } from "lucide-react";
import { Button } from "../components/actions/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/data-display/Card";
import { can } from "../lib/permissions";
import { useDocumentTitle } from "../router/guards";
import { useSession } from "../stores/session/SessionContext";

export function DashboardPage() {
  useDocumentTitle("Painel");
  const { state } = useSession();
  const user = state.user;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-h1">Olá, {user?.name}</h1>
        <p className="text-body text-ink-secondary">
          Este é o painel do starter kit. Use o menu para administrar o acesso.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {can(user, "users.viewAny") ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-brand" aria-hidden="true" />
                Usuários
              </CardTitle>
              <CardDescription>
                Crie contas, atribua papéis e gerencie o acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link to="/admin/users">Gerenciar usuários</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {can(user, "roles.viewAny") ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
                Papéis e permissões
              </CardTitle>
              <CardDescription>
                Organize permissões em papéis reutilizáveis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link to="/admin/roles">Gerenciar papéis</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
