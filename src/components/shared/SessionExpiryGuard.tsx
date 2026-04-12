import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { isSessionExpired } from "@/lib/auth-session";
import { useAuthStore } from "@/stores/authStore";

const SESSION_CHECK_INTERVAL_MS = 30000;
const IS_API_MODE = import.meta.env.VITE_MANAGER_MODE === "api";

export function SessionExpiryGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isLoggedIn, expiresAt, clearAuth } = useAuthStore();

  const enforceSessionExpiry = useCallback(() => {
    if (!IS_API_MODE || isLoading || !isLoggedIn) {
      return;
    }

    if (!isSessionExpired(expiresAt)) {
      return;
    }

    clearAuth();

    if (location.pathname !== "/login") {
      navigate("/login", {
        replace: true,
        state: { message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." },
      });
    }
  }, [clearAuth, expiresAt, isLoading, isLoggedIn, location.pathname, navigate]);

  useEffect(() => {
    enforceSessionExpiry();
  }, [enforceSessionExpiry]);

  useEffect(() => {
    if (!IS_API_MODE || !isLoggedIn) {
      return;
    }

    const timerId = window.setInterval(() => {
      enforceSessionExpiry();
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [enforceSessionExpiry, isLoggedIn]);

  useEffect(() => {
    if (!IS_API_MODE) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        enforceSessionExpiry();
      }
    };

    const handleFocus = () => {
      enforceSessionExpiry();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enforceSessionExpiry]);

  return null;
}
