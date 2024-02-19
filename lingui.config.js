/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: [
    'en',
    'de',
    'es',
    'fi',
    'fr',
    'hi',
    'id',
    'ja',
    'ko',
    'pt-BR',
    'uk',
    'ca',
    'zh-CN',
    'it',
  ],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
