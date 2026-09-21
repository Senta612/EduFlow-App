import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage, LanguageOption, TranslationDictionary } from './types';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { gu } from './locales/gu';

const LANGUAGE_STORAGE_KEY = '@eduflow_app_language';

const dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  hi,
  gu,
};

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'gu',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    flag: '🇮🇳',
  },
];

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  availableLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && (saved === 'en' || saved === 'hi' || saved === 'gu')) {
          setLanguageState(saved as SupportedLanguage);
        }
      } catch (e) {
        console.warn('Failed to load language preference:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  }, []);

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const keys = keyPath.split('.');
      let currentObj: any = dictionaries[language];
      let fallbackObj: any = dictionaries.en;

      // Traverse current language dictionary
      for (const key of keys) {
        if (currentObj && typeof currentObj === 'object') {
          currentObj = currentObj[key];
        } else {
          currentObj = undefined;
          break;
        }
      }

      // Fallback to English if missing in selected language
      if (typeof currentObj !== 'string') {
        for (const key of keys) {
          if (fallbackObj && typeof fallbackObj === 'object') {
            fallbackObj = fallbackObj[key];
          } else {
            fallbackObj = undefined;
            break;
          }
        }
        currentObj = typeof fallbackObj === 'string' ? fallbackObj : keyPath;
      }

      let result = currentObj as string;

      // Replace interpolation parameters e.g. {name} or {count}
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        });
      }

      return result;
    },
    [language],
  );

  const currentLanguageOption =
    AVAILABLE_LANGUAGES.find((l) => l.code === language) || AVAILABLE_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages: AVAILABLE_LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
