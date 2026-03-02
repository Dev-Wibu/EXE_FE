import { Navigate, Outlet } from "react-router-dom";

import { getDashboardPath, useAuthStore } from "@/stores/authStore";

export function PublicOnlyRoute() {
  const { isLoggedIn, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return <Outlet />;
}
