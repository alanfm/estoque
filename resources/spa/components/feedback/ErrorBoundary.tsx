import { Component, type ErrorInfo, type ReactNode } from "react";
import { ApiError } from "../../services/api/errors";
import { ErrorState } from "../feedback/ErrorState";

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Erro não tratado na SPA", error, info.componentStack);
  }

  private readonly reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error) {
      const requestId = error instanceof ApiError ? error.requestId : null;

      return (
        <main className="mx-auto max-w-[720px] p-6">
          <ErrorState
            title="Algo deu errado"
            message="Ocorreu um erro inesperado ao exibir esta página."
            requestId={requestId}
            onRetry={this.reset}
          />
        </main>
      );
    }

    return this.props.children;
  }
}
