import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components/actions/Button";
import { Alert } from "../components/feedback/Alert";
import { FormError } from "../components/feedback/FormError";
import { Field } from "../components/forms/Field";
import { Input } from "../components/forms/Input";
import { PageHeader } from "../components/navigation/PageHeader";
import { applyApiError } from "../lib/formErrors";
import { useDocumentTitle } from "../router/guards";
import { useSession } from "../stores/session/SessionContext";

export function ProfilePage() {
  useDocumentTitle("Meu perfil");
  const { state, syncProfile } = useSession();
  const user = state.user;
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string }>({ defaultValues: { password: "" } });
  const sync = handleSubmit(async ({ password }) => {
    setMessage(null);
    setSuccess(false);
    try {
      await syncProfile(password);
      reset();
      setSuccess(true);
    } catch (error) {
      reset();
      setMessage(applyApiError(error, setError));
    }
  });

  return (
    <div className="max-w-[720px] space-y-6">
      <PageHeader title="Meu perfil" description="Dados da sua conta." />
      <dl className="grid gap-3">
        <div>
          <dt className="font-semibold">Nome</dt>
          <dd>{user?.name}</dd>
        </div>
        <div>
          <dt className="font-semibold">Matrícula</dt>
          <dd>{user?.registry ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-semibold">E-mail</dt>
          <dd>{user?.email}</dd>
        </div>
      </dl>
      {user?.accountSource === "ldap" ? (
        <>
          <Alert variant="neutral">
            Seus dados são administrados pelo diretório institucional.
            Sincronize seu perfil para atualizar nome e e-mail.
          </Alert>
          {success ? (
            <Alert variant="success">Perfil sincronizado com sucesso.</Alert>
          ) : null}
          <FormError message={message} />
          <form noValidate onSubmit={sync} className="space-y-4">
            <Field
              id="password"
              label="Senha institucional"
              required
              error={errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="current-password"
                {...register("password", {
                  required: "Informe sua senha institucional para sincronizar.",
                })}
              />
            </Field>
            <Button type="submit" loading={isSubmitting}>
              Sincronizar com LDAP
            </Button>
          </form>
        </>
      ) : null}
    </div>
  );
}
