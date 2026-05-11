import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import zh from './zh';
import en from './en';

const deviceLanguage = getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: deviceLanguage.startsWith('zh') ? 'zh' : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
