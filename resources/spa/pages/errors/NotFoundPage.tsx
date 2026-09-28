import { Link } from "react-router";
import { SearchX } from "lucide-react";
import { Button } from "../../components/actions/Button";
import { useDocumentTitle } from "../../router/guards";

export function NotFoundPage() {
  useDocumentTitle("Página não encontrada");

  return (
    <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 py-16 text-center">
      <SearchX className="size-10 text-ink-muted" aria-hidden="true" />
      <h1 className="text-h1">Página não encontrada</h1>
      <p className="max-w-[50ch] text-body text-ink-secondary">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button asChild variant="secondary">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
