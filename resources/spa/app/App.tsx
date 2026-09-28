import { useMemo } from "react";
import { RouterProvider } from "react-router";
import { createModuleRoutes } from "../modules/registry";
import type { FrontendModuleRegistry } from "../modules/types";
import { createAppRouter } from "../router";
import { AppProviders } from "./providers/AppProviders";

export function App({ registry }: { registry: FrontendModuleRegistry }) {
  const router = useMemo(
    () => createAppRouter(createModuleRoutes(registry.routes)),
    [registry],
  );

  return (
    <AppProviders registry={registry}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
