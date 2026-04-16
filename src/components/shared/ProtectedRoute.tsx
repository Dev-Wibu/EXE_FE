import { Navigate, Outlet } from "react-router-dom";

import { SpinnerBlock } from "@/components/ui/spinner";
import type { UserRole } from "@/interfaces/schema.types";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isLoggedIn, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <SpinnerBlock fullScreen size="xl" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/error/403" replace />;
  }

  return <Outlet />;
}
