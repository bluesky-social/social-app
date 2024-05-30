// The narrow unit display for `month` in English is `m`, which conflicts with
// the one for `minute` (also `m`), this also goes for any locale that currently
// falls back to English for narrow-unit display (missing localization?)
export const MONTH_FALLBACK_LOCALES = ['en', 'ja', 'es', 'fr', 'tr']
