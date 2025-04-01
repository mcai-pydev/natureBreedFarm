import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from '../locales/en/translation.json';
import translationDE from '../locales/de/translation.json';
import translationFR from '../locales/fr/translation.json';
import translationAR from '../locales/ar/translation.json';
import translationSW from '../locales/sw/translation.json';
import translationHA from '../locales/ha/translation.json';
import translationYO from '../locales/yo/translation.json';
import translationIG from '../locales/ig/translation.json';

// The translations resources
const resources = {
  en: {
    translation: translationEN
  },
  de: {
    translation: translationDE
  },
  fr: {
    translation: translationFR
  },
  ar: {
    translation: translationAR
  },
  sw: {
    translation: translationSW
  },
  ha: {
    translation: translationHA
  },
  yo: {
    translation: translationYO
  },
  ig: {
    translation: translationIG
  }
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false, // Prevents suspense errors during development
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18n',
      lookupLocalStorage: 'i18nLang',
      caches: ['localStorage', 'cookie'],
    }
  });

// Function to get formatted currency based on locale
export const formatLocalCurrency = (amount: number, locale: string = i18n.language): string => {
  const currencyMap: { [key: string]: string } = {
    'en': 'USD',
    'de': 'EUR',
    'fr': 'EUR',
    'ar': 'AED',
    'sw': 'KES', // Kenyan Shilling (commonly used in Swahili-speaking regions)
    'ha': 'NGN', // Nigerian Naira (commonly used in Northern Nigeria where Hausa is spoken)
    'yo': 'NGN', // Nigerian Naira (commonly used in Southern Nigeria where Yoruba is spoken)
    'ig': 'NGN'  // Nigerian Naira (commonly used in Eastern Nigeria where Igbo is spoken)
  };

  // Get appropriate currency code for the locale
  const currencyCode = currencyMap[locale] || 'USD';

  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: currencyCode 
  }).format(amount);
};

// Direction helper for RTL languages
export const getLanguageDirection = (): 'ltr' | 'rtl' => {
  return i18n.language === 'ar' ? 'rtl' : 'ltr';
};

export default i18n;