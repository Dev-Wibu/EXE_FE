import { Navigate, Outlet } from "react-router-dom";

import { SpinnerBlock } from "@/components/ui/spinner";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";

export function PublicOnlyRoute() {
  const { isLoggedIn, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <SpinnerBlock fullScreen size="xl" />;
  }

  if (isLoggedIn) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return <Outlet />;
}
