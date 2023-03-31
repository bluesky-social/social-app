/// <reference lib="dom" />

// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = (cb: () => void) => setTimeout(cb, 0)

// @ts-ignore not on the TS signature due to bad support -prf
if (!globalThis.Intl?.Segmenter) {
  // NOTE loading as a separate script to reduce main bundle size, as this is only needed in FF -prf
  const script = document.createElement('script')
  script.setAttribute('src', '/static/js/intl-segmenter-polyfill.min.js')
  document.head.appendChild(script)
}
