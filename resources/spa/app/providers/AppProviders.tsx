import type { ReactNode } from "react";
import { ErrorBoundary } from "../../components/feedback/ErrorBoundary";
import { TooltipProvider } from "../../components/overlays/Tooltip";
import { ModulesProvider } from "../../modules/ModulesContext";
import type { FrontendModuleRegistry } from "../../modules/types";
import { SessionProvider } from "../../stores/session/SessionContext";
import { ThemeProvider } from "../../stores/theme/ThemeContext";

export function AppProviders({
  registry,
  children,
}: {
  registry: FrontendModuleRegistry;
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <ModulesProvider registry={registry}>
        <ErrorBoundary>
          <TooltipProvider delayDuration={200}>
            <SessionProvider>{children}</SessionProvider>
          </TooltipProvider>
        </ErrorBoundary>
      </ModulesProvider>
    </ThemeProvider>
  );
}
