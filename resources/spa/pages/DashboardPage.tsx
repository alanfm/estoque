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
import { resolveModuleGroupIcon } from "../lib/icons";
import { useModules } from "../modules/ModulesContext";
import { visibleDashboardModules } from "../modules/dashboard";
import { useDocumentTitle } from "../router/guards";
import { useSession } from "../stores/session/SessionContext";

export function DashboardPage() {
  useDocumentTitle("Painel");
  const { state } = useSession();
  const user = state.user;
  const { modules } = useModules();
  const visibleModules = visibleDashboardModules(modules, user);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-h1">Olá, {user?.name}</h1>
        <p className="text-body text-ink-secondary">
          Este é o painel do starter kit. Acesse os módulos e administre o
          acesso.
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
        {visibleModules.map((module) => {
          const Icon = resolveModuleGroupIcon(module.icon);
          return (
            <Card key={module.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-5 text-brand" aria-hidden="true" />
                  {module.displayName}
                </CardTitle>
                <CardDescription>
                  Acesse as funcionalidades de {module.displayName}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {module.navigation.map((item) => (
                  <Button asChild variant="secondary" key={item.to}>
                    <Link to={item.to}>{item.label}</Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
