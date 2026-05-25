import { Outlet } from "react-router-dom";

import { HomepageHeader } from "@/components/homepage-redesign";
import { Footer } from "./Footer";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <HomepageHeader />
      <main className="flex flex-1 items-center justify-center pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
