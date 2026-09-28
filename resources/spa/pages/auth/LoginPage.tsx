import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "../../components/actions/Button";
import { FormError } from "../../components/feedback/FormError";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { applyApiError } from "../../lib/formErrors";
import { useDocumentTitle } from "../../router/guards";
import { useSession } from "../../stores/session/SessionContext";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  useDocumentTitle("Entrar");
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const state = location.state as { from?: { pathname?: string } } | null;
  const redirectTo = state?.from?.pathname ?? "/";

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);

    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setGeneralError(applyApiError(error, setError));
    }
  });

  return (
    <div className="grid gap-[26px]">
      <div>
        <span className="block text-caption font-extrabold uppercase tracking-[0.12em] text-brand">
          Bem-vindo de volta
        </span>
        <h1 className="mb-2 mt-1.5 text-[30px] font-bold leading-[1.25] tracking-[-0.035em]">
          Entrar na plataforma
        </h1>
        <p className="text-body-sm text-ink-secondary">
          Informe suas credenciais para acessar sua área de trabalho.
        </p>
      </div>

      <FormError message={generalError} />

      <form noValidate onSubmit={onSubmit} className="grid gap-[18px]">
        <Field
          id="email"
          label="E-mail institucional"
          required
          error={errors.email?.message}
        >
          <Input
            type="email"
            autoComplete="username"
            placeholder="nome@instituicao.edu.br"
            autoFocus
            className="min-h-11"
            {...register("email", {
              required: "Informe o e-mail.",
              pattern: {
                value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                message: "Informe um e-mail válido.",
              },
            })}
          />
        </Field>

        <Field
          id="password"
          label="Senha"
          required
          error={errors.password?.message}
        >
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="min-h-11"
            {...register("password", { required: "Informe a senha." })}
          />
        </Field>

        <div className="flex items-center justify-end text-body-sm">
          <Link
            to="/forgot-password"
            className="font-semibold text-brand underline underline-offset-[3px] hover:text-brand-hover"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          size="comfortable"
          className="mt-0.5 w-full"
          loading={isSubmitting}
        >
          Entrar na plataforma
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
