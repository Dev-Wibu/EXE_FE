import { Outlet } from "react-router-dom";

import { Footer } from "./Footer";
import { Header } from "./Header";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
