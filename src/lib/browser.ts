// https://stackoverflow.com/questions/7944460/detect-safari-browser
export const isSafari = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent,
)
export const isFirefox = /firefox|fxios/i.test(navigator.userAgent)
export const isTouchDevice =
  'ontouchstart' in window || navigator.maxTouchPoints > 1
export const isAndroidWeb =
  /android/i.test(navigator.userAgent) && isTouchDevice
