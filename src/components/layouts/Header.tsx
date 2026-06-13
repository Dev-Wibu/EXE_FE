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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authManager } from "@/services/auth.manager";
import { getDashboardPath, useAuthStore } from "@/stores/authStore";
import {
  BookOpen,
  Bot,
  Building2,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LogIn,
  LogOut,
  Menu,
  Newspaper,
  Rocket,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
          </div>
          <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">{description}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, clearAuth } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await authManager.logout();
    clearAuth();
    toast.success(t("common.loggedOutSuccessfully"));
    navigate("/login");
  };
  const dashboardPath = getDashboardPath(user?.role);
  const isHomepage = location.pathname === "/";
  const showScrolledStyle = isScrolled || !isHomepage;

  const linkColorClass = showScrolledStyle
    ? "text-slate-800 hover:text-[#0047AB] dark:text-slate-200 dark:hover:text-[#66B2FF]"
    : "text-white hover:text-white dark:text-slate-200 dark:hover:text-[#66B2FF]";
  const underlineColorClass = showScrolledStyle
    ? "bg-[#0047AB] dark:bg-[#66B2FF]"
    : "bg-white dark:bg-[#66B2FF]";
  const toggleColorClass = showScrolledStyle
    ? "text-slate-700 hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]"
    : "text-white hover:text-white dark:text-slate-300 dark:hover:text-[#66B2FF]";

  const headerBgClass = showScrolledStyle
    ? "border-slate-200 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/80"
    : "border-transparent bg-white/80 shadow-none backdrop-blur-md dark:border-transparent dark:bg-slate-900/80";

  return (
    <header
      className={`fixed top-0 right-0 left-0 isolate z-50 h-16 w-full border-b transition-all duration-300 ${headerBgClass}`}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={icon2} alt="INBLUE AI" className="h-10 w-10" />
          <span className="hidden text-lg font-bold text-[#0047AB] min-[400px]:inline-block min-[400px]:text-xl dark:text-[#66B2FF]">
            INBLUE AI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {/* Enterprise - Link to company search */}
          <Button
            variant="ghost"
            asChild
            className={`group/item relative text-sm font-medium transition-colors duration-300 ${linkColorClass}`}>
            <Link to="/enterprise/companies">
              <Building2 className="mr-2 h-4 w-4" />
              {t("common.company")}
              <span
                className={`absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 transition-all group-hover/item:w-1/2 ${underlineColorClass}`}
              />
            </Link>
          </Button>

          {/* Tính năng - Dropdown */}
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`group/item relative bg-transparent text-sm font-medium transition-colors duration-300 ${linkColorClass}`}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t("common.features")}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 transition-all group-hover/item:w-1/2 ${underlineColorClass}`}
                  />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-0">
                  <ul className="grid w-[480px] grid-cols-2 gap-2 p-3">
                    <MenuItem
                      to="/features/ai-interview"
                      icon={<Bot className="h-4 w-4" />}
                      title={t("common.virtualInterviewRoom")}
                      description={t("common.experienceInterviewingWithAi")}
                    />
                    <MenuItem
                      to="/features/mentor-interview"
                      icon={<Users className="h-4 w-4" />}
                      title={t("common.mentorInterview")}
                      description={t("common.connectWithRealMentors")}
                    />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Câu hỏi - Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`group/item relative bg-transparent text-sm font-medium transition-colors duration-300 ${linkColorClass}`}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t("common.question")}
                  <span
                    className={`absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 transition-all group-hover/item:w-1/2 ${underlineColorClass}`}
                  />
                </NavigationMenuTrigger>
                <NavigationMenuContent className="!left-0">
                  <ul className="grid w-[480px] grid-cols-2 gap-2 p-3">
                    <MenuItem
                      to="/questions/bank"
                      icon={<BookOpen className="h-4 w-4" />}
                      title={t("common.questionBank")}
                      description={t("common.over1500RealInterviewQuestions")}
                    />
                    <MenuItem
                      to="/questions/tips"
                      icon={<Lightbulb className="h-4 w-4" />}
                      title={t("common.interviewTips")}
                      description={t("common.interviewTipsFromExperts")}
                    />
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Blog - Simple Link */}
          <Button
            variant="ghost"
            asChild
            className={`group/item relative text-sm font-medium transition-colors duration-300 ${linkColorClass}`}>
            <Link to="/resources/blog">
              <Newspaper className="mr-2 h-4 w-4" />
              {t("common.article")}
              <span
                className={`absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 transition-all group-hover/item:w-1/2 ${underlineColorClass}`}
              />
            </Link>
          </Button>

          {/* FAQ - Simple Link */}
          <Button
            variant="ghost"
            asChild
            className={`group/item relative text-sm font-medium transition-colors duration-300 ${linkColorClass}`}>
            <Link to="/resources/faq">
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQ
              <span
                className={`absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 transition-all group-hover/item:w-1/2 ${underlineColorClass}`}
              />
            </Link>
          </Button>
        </nav>

        {/* Auth Area & Theme Toggle */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Theme & Language Toggles - always visible on header */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LanguageToggle className={toggleColorClass} />
            <ThemeToggle
              iconOnly
              className={`shrink-0 transition-colors duration-300 ${toggleColorClass}`}
            />
          </div>

          {isLoggedIn && user /* ── Logged-in: avatar dropdown ── */ ? (
            <div className="w-10 shrink-0">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-10 w-full items-center justify-center rounded-full border border-slate-200 bg-white transition-colors hover:bg-slate-50 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? "User"} />
                      <AvatarFallback className="bg-[#DCEEFF] text-xs font-semibold text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[100px] truncate text-sm font-medium text-slate-700 md:inline dark:text-slate-200">
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
                    <Link to="/user/account" className="cursor-pointer gap-2">
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
            </div> /* ── Logged-out: login & signup buttons ── */
          ) : (
            <>
              <Button
                variant="ghost"
                className="px-2 text-slate-800 hover:text-[#0047AB] sm:px-4 dark:text-slate-200 dark:hover:text-[#66B2FF]"
                asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("common.logIn")}</span>
                </Link>
              </Button>
              <Button
                className="rounded-full border-0 bg-gradient-to-r from-[#0047AB] to-[#007BFF] px-3 text-white shadow-sm hover:text-white hover:shadow-md sm:px-6"
                asChild>
                <Link to="/signup">
                  <Rocket className="h-4 w-4 text-white sm:mr-2" />
                  <span className="hidden sm:inline">{t("common.register")}</span>
                </Link>
              </Button>
            </>
          )}

          {/* Mobile Drawer */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`ml-1 transition-colors duration-300 ${
                    showScrolledStyle
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-white dark:text-slate-200"
                  }`}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[75vw] border-l border-slate-200 bg-white/95 backdrop-blur-xl sm:w-[300px] dark:border-slate-800 dark:bg-slate-950/95">
                <SheetHeader className="mb-4 border-b border-slate-100 pb-4 text-left dark:border-slate-800">
                  <SheetTitle className="flex items-center gap-2">
                    <img src={icon2} alt="INBLUE AI" className="h-8 w-8" />
                    <span className="font-bold text-[#0047AB] dark:text-[#66B2FF]">INBLUE AI</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex h-[calc(100vh-7rem)] flex-col justify-between overflow-y-auto pb-4">
                  <div className="space-y-4">
                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-4">
                      {/* Company */}
                      <div className="space-y-1">
                        <Link
                          to="/enterprise/companies"
                          className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                          <Building2 className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                          {t("common.company")}
                        </Link>
                      </div>

                      {/* Features Group */}
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                          {t("common.features")}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to="/features/ai-interview"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                            <Bot className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                            {t("common.virtualInterviewRoom")}
                          </Link>
                          <Link
                            to="/features/mentor-interview"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                            <Users className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                            {t("common.mentorInterview")}
                          </Link>
                        </div>
                      </div>

                      {/* Questions Group */}
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                          {t("common.question")}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to="/questions/bank"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                            <BookOpen className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                            {t("common.questionBank")}
                          </Link>
                          <Link
                            to="/questions/tips"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                            <Lightbulb className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                            {t("common.interviewTips")}
                          </Link>
                        </div>
                      </div>

                      {/* Resources Group */}
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                          {t("common.resources")}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to="/resources/blog"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                            <Newspaper className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                            {t("common.article")}
                          </Link>
                          <Link
                            to="/resources/faq"
                            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-[#66B2FF]">
                            <HelpCircle className="h-5 w-5 text-slate-500 transition-colors group-hover:text-[#0047AB] dark:text-slate-400 dark:group-hover:text-[#66B2FF]" />
                            FAQ
                          </Link>
                        </div>
                      </div>
                    </nav>
                  </div>

                  {/* Bottom Auth Actions */}
                  <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                    {isLoggedIn && user ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-100/50 bg-slate-50/50 px-3 py-2 dark:border-slate-800/50 dark:bg-slate-900/40">
                          <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800">
                            <AvatarImage
                              src={user.avatarUrl ?? undefined}
                              alt={user.name ?? "User"}
                            />
                            <AvatarFallback className="bg-[#DCEEFF] text-xs font-semibold text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {user.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            to={dashboardPath}
                            className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                            <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
                            {t("common.dashboard")}
                          </Link>
                          <Link
                            to="/user/account"
                            className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                            <UserCircle className="h-3.5 w-3.5 text-slate-500" />
                            {t("common.account")}
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20">
                            <LogOut className="h-3.5 w-3.5 text-red-500" />
                            {t("common.logout")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="h-9 w-full justify-center rounded-xl py-4 text-xs"
                          asChild>
                          <Link to="/login">
                            <LogIn className="mr-1.5 h-3.5 w-3.5" />
                            {t("common.logIn")}
                          </Link>
                        </Button>
                        <Button
                          className="h-9 w-full justify-center rounded-xl border-0 bg-gradient-to-r from-[#0047AB] to-[#007BFF] py-4 text-xs text-white shadow-sm hover:shadow-md"
                          asChild>
                          <Link to="/signup">
                            <Rocket className="mr-1.5 h-3.5 w-3.5" />
                            {t("common.register")}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
