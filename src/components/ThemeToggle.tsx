import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
/**
 * Theme Toggle Button Component
 * Allows users to switch between light, dark, and system themes
 */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeStore, type Theme } from "@/stores/themeStore";
import { Monitor, Moon, Sun } from "lucide-react";
interface ThemeToggleProps {
  /** Optional className for custom styling */
  className?: string;
  /** Show as icon only (for compact layouts) */
  iconOnly?: boolean;
}
export function ThemeToggle({ className, iconOnly = false }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };
  if (iconOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={cn("h-9 w-12 shrink-0", className)}>
            <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">{t("compThemetoggle.switchInterface")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleThemeChange("light")}
            className={theme === "light" ? "bg-accent" : ""}>
            <Sun className="mr-2 h-4 w-4" />
            <span>{t("common.bright")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleThemeChange("dark")}
            className={theme === "dark" ? "bg-accent" : ""}>
            <Moon className="mr-2 h-4 w-4" />
            <span>{t("common.dark")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleThemeChange("system")}
            className={theme === "system" ? "bg-accent" : ""}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>{t("common.system")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Sun className="mr-2 h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute mr-2 h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="ml-4">{t("common.interface")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className={theme === "light" ? "bg-accent" : ""}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t("common.bright")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className={theme === "dark" ? "bg-accent" : ""}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t("common.dark")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className={theme === "system" ? "bg-accent" : ""}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>{t("common.system")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
