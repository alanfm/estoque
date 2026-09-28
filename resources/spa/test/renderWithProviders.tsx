import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { TooltipProvider } from "../components/overlays/Tooltip";
import { SessionProvider } from "../stores/session/SessionContext";
import { ThemeProvider } from "../stores/theme/ThemeContext";

interface Options extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  withSession?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", withSession = true, ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const content = withSession ? (
      <SessionProvider>{children}</SessionProvider>
    ) : (
      children
    );

    return (
      <ThemeProvider>
        <TooltipProvider delayDuration={200}>
          <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
        </TooltipProvider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
