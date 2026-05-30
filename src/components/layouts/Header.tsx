import {
  BookOpen,
  Bot,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Newspaper,
  UserCircle,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import icon2 from "@/assets/icon2.svg";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { authManager } from "@/services/auth.manager";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Get user initials for the avatar fallback.
 */
function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await authManager.logout();
    clearAuth();
    toast.success(t("common.logout_success"));
    navigate("/login");
  };

  const dashboardPath = getDashboardPath(user?.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={icon2} alt="INBLUE AI" className="h-10 w-10" />
          <span className="text-lg font-bold tracking-tight text-[#002654] dark:text-white">
            INBLUE AI
          </span>
        </Link>

        {/* Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Questions Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                {t("navigation.questions")}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/questions/bank"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">
                            {t("navigation.question_bank")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("navigation.question_bank_desc")}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/questions/tips"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">
                            {t("navigation.interview_tips")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("navigation.interview_tips_desc")}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Features Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                {t("navigation.features")}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/features/ai-interview"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">
                            {t("navigation.ai_interview_alt")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("navigation.ai_interview_desc_alt")}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/features/mentor-interview"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">
                            {t("navigation.mentor_interview_alt")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("navigation.mentor_interview_desc_alt")}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Resources Menu */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                {t("navigation.resources")}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/resources/faq"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">{t("navigation.faq")}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("navigation.faq_desc_alt")}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/resources/blog"
                        className="flex flex-col gap-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-[#DCEEFF] hover:text-[#0047AB] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
                        <div className="flex items-center gap-2">
                          <Newspaper className="h-5 w-5 text-[#0047AB] dark:text-[#66B2FF]" />
                          <span className="text-sm font-medium">{t("navigation.blog")}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("navigation.blog_desc_alt")}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Auth Area & Theme Toggle */}
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle iconOnly />

          {isLoggedIn && user ? (
            /* ── Logged-in: avatar dropdown ── */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100 focus:outline-none dark:hover:bg-slate-800"
                  style={{ minWidth: "2.5rem" }}>
                  <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "User"} />
                    <AvatarFallback className="bg-[#DCEEFF] text-xs font-semibold text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 md:inline dark:text-slate-200">
                    {user.name}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to={dashboardPath} className="cursor-pointer gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {t("common.dashboard")}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to={`${dashboardPath}?tab=account`} className="cursor-pointer gap-2">
                    <UserCircle className="h-4 w-4" />
                    {t("common.account")}
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* ── Logged-out: login & signup buttons ── */
            <>
              <Button variant="ghost" className="text-slate-600 dark:text-slate-300" asChild>
                <Link to="/login">{t("common.login")}</Link>
              </Button>
              <Button
                className="rounded-full bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-6 shadow-sm hover:shadow-md"
                asChild>
                <Link to="/select-role">{t("common.get_started")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
