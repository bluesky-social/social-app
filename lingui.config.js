/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: [
    'en',
    'an',
    'ast',
    'ca',
    'de',
    'en-GB',
    'es',
    'fi',
    'fr',
    'ga',
    'gl',
    'hi',
    'hu',
    'id',
    'it',
    'ja',
    'km',
    'ko',
    'ne',
    'nl',
    'pl',
    'pt-BR',
    'ro',
    'ru',
    'th',
    'tr',
    'uk',
    'vi',
    'zh-CN',
    'zh-HK',
    'zh-TW',
    'he',
  ],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
