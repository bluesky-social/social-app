// https://stackoverflow.com/questions/7944460/detect-safari-browser
export const isSafari = /^((?!chrome|android).)*safari/i.test(
  navigator.userAgent,
)
export const isFirefox = /firefox|fxios/i.test(navigator.userAgent)
export const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
export const IS_ANDROIDWeb =
  /android/i.test(navigator.userAgent) && isTouchDevice
export const isHighDPI = window.matchMedia('(min-resolution: 2dppx)').matches
