// gettext-style localization.
//
// Translations live in /locales/*.po and are compiled to ./locales/generated.json
// by scripts/compileLocales.mjs before building or testing.
//
// Usage:
//   _('Show line numbers')
//   _('Follow link: %s', url)
//   _c('editor maximum width', 'None')   // with msgctxt

import catalogsJson from './locales/generated.json';

// Maps "msgid" (or "msgctxt\u0004msgid") to the translated string.
export type Catalog = Record<string, string>;

const catalogs: Record<string, Catalog> = catalogsJson as Record<string, Catalog>;

// Locales that should be mapped to a different catalog than a simple
// language-prefix match would choose.
const localeAliases: Record<string, string> = {
	zh_HK: 'zh_TW',
	zh_MO: 'zh_TW',
	zh_Hant: 'zh_TW',
	zh_SG: 'zh_CN',
	zh_Hans: 'zh_CN',
	zh: 'zh_CN',
};

const contextSeparator = '\u0004';

const normalizeLocale = (locale: string) => locale.trim().replace(/-/g, '_');

/**
 * Returns the name of the catalog best matching `locale`, or null if none matches.
 * Matching order: exact match, alias, then any catalog with the same language code.
 */
export const resolveLocale = (locale: string, available: string[]): string | null => {
	if (!locale) return null;
	const normalized = normalizeLocale(locale);
	const lowerAvailable = available.map(l => l.toLowerCase());

	const findExact = (name: string) => {
		const index = lowerAvailable.indexOf(name.toLowerCase());
		return index === -1 ? null : available[index];
	};

	const exact = findExact(normalized);
	if (exact) return exact;

	// e.g. "zh_HK" or "zh_Hant_TW" (but not plain "zh", which is handled below)
	const lowerNormalized = normalized.toLowerCase();
	for (const [from, to] of Object.entries(localeAliases)) {
		const lowerFrom = from.toLowerCase();
		if (!from.includes('_')) continue;
		if (lowerNormalized === lowerFrom || lowerNormalized.startsWith(`${lowerFrom}_`)) {
			const aliased = findExact(to);
			if (aliased) return aliased;
		}
	}

	const language = normalized.split('_')[0].toLowerCase();
	if (localeAliases[language]) {
		const aliased = findExact(localeAliases[language]);
		if (aliased) return aliased;
	}

	const languageMatch = available.find(l => l.split('_')[0].toLowerCase() === language);
	return languageMatch ?? null;
};

let currentCatalog: Catalog = {};
let currentLocale = 'en';

export const availableLocales = () => Object.keys(catalogs);

/** Sets the active locale. Accepts Joplin-style ("ja_JP") or BCP 47 ("ja-JP") names. */
export const setLocale = (locale: string | null | undefined) => {
	const resolved = locale ? resolveLocale(locale, availableLocales()) : null;
	if (resolved) {
		currentCatalog = catalogs[resolved];
		currentLocale = resolved;
	} else {
		currentCatalog = {};
		currentLocale = 'en';
	}
	return currentLocale;
};

export const getLocale = () => currentLocale;

/** Picks a locale from the browser/OS languages. Used as a fallback when Joplin's locale is unavailable. */
export const setLocaleFromNavigator = () => {
	const languages = typeof navigator !== 'undefined' ? [...(navigator.languages ?? [])] : [];
	for (const language of languages) {
		if (resolveLocale(language, availableLocales())) {
			return setLocale(language);
		}
	}
	return setLocale('en');
};

const formatString = (template: string, args: (string | number)[]) => {
	let index = 0;
	return template.replace(/%%|%s/g, match => {
		if (match === '%%') return '%';
		const arg = args[index++];
		return arg === undefined ? '' : String(arg);
	});
};

const lookup = (key: string) => {
	const translated = currentCatalog[key];
	return translated ? translated : null;
};

/** Translates `message` (gettext). `%s` placeholders are replaced by `args` in order. */
export const _ = (message: string, ...args: (string | number)[]) => {
	return formatString(lookup(message) ?? message, args);
};

/** Translates `message` with a disambiguating context (pgettext). */
export const _c = (context: string, message: string, ...args: (string | number)[]) => {
	return formatString(lookup(`${context}${contextSeparator}${message}`) ?? message, args);
};

// Default until the plugin/content script sets Joplin's locale explicitly.
setLocaleFromNavigator();
