/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: [
    'en',
    'ca',
    'de',
    'es',
    'fi',
    'fr',
    'ga',
    'hi',
    'id',
    'it',
    'ja',
    'ko',
    'pt-BR',
    'ru',
    'tr',
    'uk',
    'zh-CN',
    'zh-HK',
    'zh-TW',
  ],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
