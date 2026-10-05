import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "../../components/actions/Button";
import { FormError } from "../../components/feedback/FormError";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { applyApiError } from "../../lib/formErrors";
import { ApiError } from "../../services/api/errors";
import { useDocumentTitle } from "../../router/guards";
import { authService } from "../../services/auth/authService";
import { useSession } from "../../stores/session/SessionContext";
import type { AuthOptions, LoginCredentials } from "../../types/auth";

interface LoginFormValues {
  registry: string;
  password: string;
}

export function LoginPage() {
  useDocumentTitle("Entrar");
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [options, setOptions] = useState<AuthOptions | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { registry: "", password: "" },
  });

  useEffect(() => {
    const controller = new AbortController();
    void authService
      .options(controller.signal)
      .then((result) => {
        setOptions(result);
      })
      .catch((error: unknown) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "AbortError"
        ) {
          return;
        }
        setOptionsError(true);
      });
    return () => controller.abort();
  }, []);

  const state = location.state as { from?: { pathname?: string } } | null;
  const redirectTo = state?.from?.pathname ?? "/";

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    const credentials: LoginCredentials = {
      provider: "auto",
      registry: values.registry.trim().toLowerCase(),
      password: values.password,
    };
    try {
      await login(credentials);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setValue("password", "");
        setGeneralError(error.message);
      } else {
        setGeneralError(applyApiError(error, setError));
      }
    }
  });

  const canSubmit =
    options !== null &&
    !optionsError &&
    (options.localEnabled || options.ldapEnabled);

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

      {optionsError ? (
        <p role="alert" className="text-body-sm text-danger">
          Não foi possível carregar as opções de acesso. Tente novamente.
        </p>
      ) : null}
      <FormError message={generalError} />

      <form noValidate onSubmit={onSubmit} className="grid gap-[18px]">
        <Field
          id="registry"
          label="Matrícula"
          required
          error={errors.registry?.message}
        >
          <Input
            autoComplete="username"
            autoFocus
            placeholder="Informe sua matrícula"
            className="min-h-11"
            {...register("registry", {
              required: "Informe a matrícula.",
              pattern: {
                value: /^[a-zA-Z0-9._-]+$/,
                message: "Informe uma matrícula válida.",
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

        <div className="grid gap-2 text-right text-body-sm">
          <Link
            to="/forgot-password"
            className="font-semibold text-brand underline underline-offset-[3px] hover:text-brand-hover"
          >
            Recuperar senha local
          </Link>
          {options?.ldapEnabled ? (
            options.ldapPasswordHelpUrl ? (
              <a
                href={options.ldapPasswordHelpUrl}
                className="font-semibold text-brand underline underline-offset-[3px]"
              >
                Recuperar senha institucional
              </a>
            ) : (
              <span className="text-ink-muted">
                Para recuperar a senha institucional, procure a TI do IFCE.
              </span>
            )
          ) : null}
        </div>

        <Button
          type="submit"
          size="comfortable"
          className="mt-0.5 w-full"
          loading={isSubmitting}
          disabled={!canSubmit}
        >
          Entrar na plataforma{" "}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
