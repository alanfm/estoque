import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { loadModuleRegistry } from "./modules/bootstrap";
import "./styles/globals.css";

const element = document.getElementById("app");

if (!element) throw new Error("SPA root missing");

async function bootstrap() {
  const registry = await loadModuleRegistry();

  if (registry.issues.length > 0) {
    console.warn("[modules] problemas de registro:", registry.issues);
  }

  createRoot(element as HTMLElement).render(
    <React.StrictMode>
      <App registry={registry} />
    </React.StrictMode>,
  );
}

void bootstrap();
