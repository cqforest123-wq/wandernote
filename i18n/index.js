import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import zh from './zh';
import en from './en';
import ja from './ja';
import ko from './ko';
import fr from './fr';
import es from './es';
import th from './th';

const deviceLanguage = getLocales()[0]?.languageCode || 'en';

const getLang = (code) => {
  if (code.startsWith('zh')) return 'zh';
  if (code.startsWith('ja')) return 'ja';
  if (code.startsWith('ko')) return 'ko';
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('es')) return 'es';
  if (code.startsWith('th')) return 'th';
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      zh: { translation: zh },
      en: { translation: en },
      ja: { translation: ja },
      ko: { translation: ko },
      fr: { translation: fr },
      es: { translation: es },
      th: { translation: th },
    },
    lng: getLang(deviceLanguage),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;

// 联系邮箱：predestina@msn.com
