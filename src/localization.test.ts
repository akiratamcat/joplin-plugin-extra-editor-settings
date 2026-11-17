import { _, _c, availableLocales, getLocale, resolveLocale, setLocale } from './localization';

describe('localization', () => {
	afterEach(() => {
		setLocale('en');
	});

	test.each([
		// Joplin-style locale names
		['ja_JP', 'ja_JP'],
		['zh_CN', 'zh_CN'],
		['zh_TW', 'zh_TW'],
		['pt_BR', 'pt_BR'],
		// BCP 47 names (e.g. from navigator.languages)
		['ja-JP', 'ja_JP'],
		['ko', 'ko_KR'],
		['de-AT', 'de_DE'],
		// Aliases
		['zh_HK', 'zh_TW'],
		['zh-Hant-TW', 'zh_TW'],
		['zh', 'zh_CN'],
		['zh_SG', 'zh_CN'],
		// Language-only fallback
		['pt_PT', 'pt_BR'],
		['es_MX', 'es_ES'],
		// No match
		['en_GB', null],
		['xx', null],
		['', null],
	])('should resolve %j to %j', (locale, expected) => {
		expect(resolveLocale(locale, availableLocales())).toBe(expected);
	});

	test('should include all expected catalogs', () => {
		expect(availableLocales().sort()).toEqual([
			'de_DE', 'es_ES', 'fr_FR', 'hr_HR', 'it_IT', 'ja_JP', 'ko_KR', 'pt_BR', 'ru_RU', 'zh_CN', 'zh_TW',
		]);
	});

	test('should translate after setting the locale', () => {
		expect(setLocale('ja_JP')).toBe('ja_JP');
		expect(getLocale()).toBe('ja_JP');
		expect(_('Show line numbers')).toBe('行番号を表示');
	});

	test('should replace %s placeholders', () => {
		setLocale('ja_JP');
		expect(_('Follow link: %s', 'https://example.com/')).toBe('リンクを開く: https://example.com/');
		setLocale('en');
		expect(_('Follow link: %s', 'https://example.com/')).toBe('Follow link: https://example.com/');
		expect(_('100%% of %s', 'x')).toBe('100% of x');
	});

	test('should support message contexts', () => {
		setLocale('ja_JP');
		expect(_c('sync indicator', 'No')).toBe('表示しない');
		expect(_c('hide markdown', 'None')).toBe('なし');
	});

	test('should fall back to English for unknown locales and untranslated strings', () => {
		expect(setLocale('xx_YY')).toBe('en');
		expect(_('Show line numbers')).toBe('Show line numbers');

		setLocale('ja_JP');
		expect(_('This string is not translated')).toBe('This string is not translated');
		expect(_c('unknown context', 'Show line numbers')).toBe('Show line numbers');
	});
});
