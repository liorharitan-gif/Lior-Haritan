import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { RESOURCES, LANGUAGES } from "./locales";

// RTL Logic
const updateDirection = (language: string) => {
  const langObj = LANGUAGES.find(l => l.code === language);
  const dir = langObj?.dir || 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: RESOURCES,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Set initial direction based on detected or default language
updateDirection(i18next.language || 'he');

// Listen for language changes
i18next.on('languageChanged', (lng) => {
  updateDirection(lng);
});

export default i18next;