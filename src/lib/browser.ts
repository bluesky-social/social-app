// https://stackoverflow.com/questions/7944460/detect-safari-browser
export const isSafari = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent,
)
export const isFirefox = /firefox|fxios/i.test(navigator.userAgent)
export const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
export const isAndroidWeb =
  /android/i.test(navigator.userAgent) && isTouchDevice
