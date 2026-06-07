import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import ja from "@/locales/ja.json";
import vi from "@/locales/vi.json";

i18n
  // Detects user language
  .use(LanguageDetector)
  // Passes i18n down to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      vi: {
        translation: vi,
      },
      ja: {
        translation: ja,
      },
    },
    // If you're using a language detector, do not define the lng option
    // fallback language is very important!
    fallbackLng: "vi",

    // Have a common namespace used around the full app
    defaultNS: "translation",

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Order and from where user language should be detected
      order: ["localStorage", "navigator"],

      // Keys or params to lookup language from
      lookupLocalStorage: "i18nextLng",

      // Cache user language on
      caches: ["localStorage"],
    },
  });

export default i18n;
