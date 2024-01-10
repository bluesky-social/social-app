/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ['en', 'hi', 'ja', 'fr', 'de', 'es', 'ko', 'es', 'es-419', 'pt-BR', 'uk', 'id'],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
