import { i18n } from '@lingui/core';
import { de, en } from 'make-plural/plurals';

i18n.loadLocaleData({
  de: { plurals: de },
  en: { plurals: en }
});

export async function loadCatalog(locale: string) {
  const { messages } = await import(`./locales/${locale}/messages`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

// Set initial locale
export const defaultLocale = 'de';
loadCatalog(defaultLocale);

export { i18n };
