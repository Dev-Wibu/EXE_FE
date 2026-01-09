import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";

export function UserDashboardLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
