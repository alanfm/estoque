import { Link } from "react-router";
import { ShieldX } from "lucide-react";
import { Button } from "../../components/actions/Button";
import { useDocumentTitle } from "../../router/guards";

export function ForbiddenPage() {
  useDocumentTitle("Acesso negado");

  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 py-16 text-center">
      <ShieldX className="size-10 text-danger-status" aria-hidden="true" />
      <h1 className="text-h1">Acesso negado</h1>
      <p className="max-w-[50ch] text-body text-ink-secondary">
        Sua conta não tem permissão para acessar esta página. Se precisar de
        acesso, procure um administrador.
      </p>
      <Button asChild variant="secondary">
        <Link to="/">Voltar ao painel</Link>
      </Button>
    </div>
  );
}
