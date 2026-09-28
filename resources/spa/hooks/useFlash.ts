import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export function useFlash(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [message] = useState(
    () => (location.state as { flash?: string } | null)?.flash ?? null,
  );

  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location, navigate]);

  return message;
}
