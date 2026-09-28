import { createBrowserRouter } from "react-router";
import type { RouteObject } from "react-router";
import { createRoutes } from "./routes";

export function createAppRouter(moduleRoutes: RouteObject[] = []) {
  return createBrowserRouter(createRoutes(moduleRoutes));
}
