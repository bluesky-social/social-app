module.exports = {
  globDirectory: 'web/',
  globPatterns: ['**/*.{html,json,js}'],
  swDest: 'web/pwa/scripts/workbox/pwa-service-worker.js',
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
}
