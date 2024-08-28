// NOTE: Service workers will only get accepted by browsers via HTTPS. You must use HTTPS for your dev webserver: expo start --web --https
if ('serviceWorker' in navigator) {
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    // Probably not a PWA - doesn't pass the vibe check.
    return
  }

  window.addEventListener('load', () => {
    // NOTE: For PWA service-worker scripts to appear in '/pwa/scripts/workbox/', you must run: npx workbox-cli generateSW web/workbox-config.js
    navigator.serviceWorker
      .register('/pwa/scripts/workbox/pwa-service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope)
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error)
      })
  })
}
