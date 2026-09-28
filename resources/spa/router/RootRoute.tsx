import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

export function RootRoute() {
  const location = useLocation();

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  return <Outlet />;
}
