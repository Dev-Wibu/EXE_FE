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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex h-9 items-center gap-1.5 px-2 text-slate-700 hover:text-[#0047AB] dark:text-slate-300 dark:hover:text-[#66B2FF]",
            className
          )}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="text-xs font-semibold uppercase">{language}</span>
          <span className="sr-only">{t("common.toggleLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleLanguageChange("vi")}
          className={language === "vi" ? "bg-accent" : ""}>
          {t("common.vietnameseVi")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("en")}
          className={language === "en" ? "bg-accent" : ""}>
          {t("settings.englishEn")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange("ja")}
          className={language === "ja" ? "bg-accent" : ""}>
          {t("settings.japaneseJa")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
