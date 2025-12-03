import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 px-6 py-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="font-['Manrope'] text-sm font-semibold text-slate-500">
          Copyright © 2025 INLUE AI
        </div>
        <div className="font-['Manrope'] text-sm font-semibold">
          <span className="text-slate-500">All Rights Reserved | </span>
          <Link to="/terms" className="text-indigo-600 hover:underline">
            Terms and Conditions
          </Link>
          <span className="text-slate-500"> | </span>
          <Link to="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
