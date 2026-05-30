import {
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  LogOut,
  Newspaper,
  Settings,
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

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Reusable menu item component for consistent styling
interface MenuItemProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function MenuItem({ to, icon, title, description }: MenuItemProps) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={to}
          className="group flex h-[72px] w-full flex-col justify-center rounded-md p-3 no-underline transition-colors outline-none hover:bg-[#DCEEFF] hover:text-[#0058be] dark:hover:bg-[#0047AB]/20 dark:hover:text-[#66B2FF]">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0058be]/10 text-[#0058be] transition-colors group-hover:bg-[#0058be] group-hover:text-white dark:bg-[#66B2FF]/20 dark:text-[#66B2FF] dark:group-hover:bg-[#66B2FF] dark:group-hover:text-slate-900">
              {icon}
            </span>
            <span className="text-sm font-medium">{title}</span>
            <ChevronRight className="ml-auto h-4 w-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">{description}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function HomepageHeader() {
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
    <header className="fixed top-0 right-0 left-0 isolate z-50 h-16 border-b border-white/10 bg-white/70 shadow-sm backdrop-blur-lg dark:border-slate-800/50 dark:bg-slate-900/70">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={icon2} alt="INBLUE AI" className="h-10 w-10" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            INBLUE AI
          </span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {/* Enterprise - Link to company search */}
          <Button
            variant="ghost"
            asChild
            className="text-sm font-medium text-slate-600 hover:text-[#0058be] dark:text-slate-300 dark:hover:text-[#66B2FF]">
            <Link to="/enterprise/companies">{t("navigation.companies")}</Link>
          </Button>

          {/* Blog - Simple Link */}
          <Button
            variant="ghost"
            asChild
            className="text-sm font-medium text-slate-600 hover:text-[#0058be] dark:text-slate-300 dark:hover:text-[#66B2FF]">
            <Link to="/resources/blog">{t("navigation.blog")}</Link>
          </Button>

          {/* Tính năng - Dropdown */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0058be] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                  {t("navigation.features")}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-0">
                  <ul className="grid w-[480px] grid-cols-2 gap-2 p-3">
                    <MenuItem
                      to="/features/ai-interview"
                      icon={<Bot className="h-4 w-4" />}
                      title={t("navigation.ai_interview")}
                      description={t("navigation.ai_interview_desc")}
                    />
                    <MenuItem
                      to="/features/mentor-interview"
                      icon={<Users className="h-4 w-4" />}
                      title={t("navigation.mentor_interview")}
                      description={t("navigation.mentor_interview_desc")}
                    />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Câu hỏi & Tài nguyên - Dropdowns */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {/* Câu hỏi - Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0058be] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                  {t("navigation.questions")}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-0">
                  <ul className="grid w-[480px] grid-cols-2 gap-2 p-3">
                    <MenuItem
                      to="/questions/bank"
                      icon={<BookOpen className="h-4 w-4" />}
                      title={t("navigation.question_bank")}
                      description={t("navigation.question_bank_desc")}
                    />
                    <MenuItem
                      to="/questions/tips"
                      icon={<Lightbulb className="h-4 w-4" />}
                      title={t("navigation.interview_tips")}
                      description={t("navigation.interview_tips_desc")}
                    />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Tài nguyên - Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm font-medium text-slate-600 hover:bg-transparent hover:text-[#0058be] dark:text-slate-300 dark:hover:text-[#66B2FF]">
                  {t("navigation.resources")}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-0">
                  <ul className="grid w-[480px] grid-cols-2 gap-2 p-3">
                    <MenuItem
                      to="/resources/faq"
                      icon={<HelpCircle className="h-4 w-4" />}
                      title={t("navigation.faq")}
                      description={t("navigation.faq_desc")}
                    />
                    <MenuItem
                      to="/resources/blog"
                      icon={<Newspaper className="h-4 w-4" />}
                      title={t("navigation.blog")}
                      description={t("navigation.blog_desc")}
                    />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle iconOnly />

          {isLoggedIn && user ? (
            <>
              <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/50 p-1 transition-colors hover:bg-white/80 focus:outline-none dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "User"} />
                      <AvatarFallback className="bg-[#d8e2ff] text-xs font-semibold text-[#0058be] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
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
                      <Settings className="h-4 w-4" />
                      {t("common.dashboard")}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={`${dashboardPath}?tab=account`} className="cursor-pointer gap-2">
                      <Settings className="h-4 w-4" />
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
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-slate-600 dark:text-slate-300" asChild>
                <Link to="/login">{t("common.login")}</Link>
              </Button>
              <Button
                className="rounded-lg bg-[#0058be] px-5 py-2 font-medium shadow-sm hover:bg-[#004395] dark:bg-[#0058be] dark:hover:bg-[#004395]"
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
