import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Language, useSettingsStore } from "@/stores/settingsStore";
import { Globe } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSettingsStore();

  // Sync i18n language with store language on mount or change
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-9 w-12 shrink-0 items-center justify-center gap-1.5 px-0 text-slate-700 hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]",
            className
          )}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="text-xs font-semibold uppercase">{language}</span>
          <span className="sr-only">{t("common.toggleLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 border border-slate-200 bg-white/95 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <DropdownMenuItem
          onClick={() => handleLanguageChange("vi")}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center px-3 text-sm",
            language === "vi"
              ? "bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#66B2FF]"
          )}>
          {t("common.vietnameseVi")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center px-3 text-sm",
            language === "en"
              ? "bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#66B2FF]"
          )}>
          {t("settings.englishEn")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("ja")}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center px-3 text-sm",
            language === "ja"
              ? "bg-[#DCEEFF] text-[#0047AB] dark:bg-[#0047AB]/30 dark:text-[#66B2FF]"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#0047AB] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-[#66B2FF]"
          )}>
          {t("settings.japaneseJa")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
