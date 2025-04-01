import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useEffect } from "react";
import { getLanguageDirection } from "@/lib/i18n";

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  
  // Update document direction when language changes
  useEffect(() => {
    const dir = getLanguageDirection();
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Map of language codes to their display names
  const languages = {
    en: "English",
    de: "Deutsch",
    fr: "Français",
    ar: "العربية",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("common.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => changeLanguage(code)}
            className={i18n.language === code ? "bg-muted font-medium" : ""}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}