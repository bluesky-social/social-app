/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: [
    'en',
    'ca',
    'de',
    'es',
    'fi',
    'fr',
    'hi',
    'id',
    'it',
    'ja',
    'ko',
    'pt-BR',
    'uk',
    'zh-CN',
  ],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
