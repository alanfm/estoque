import { Alert } from "../feedback/Alert";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <Alert variant="danger" title="Não foi possível concluir">
      {message}
    </Alert>
  );
}
