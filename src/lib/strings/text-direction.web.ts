/**
 * React Native Web sets `dir="auto"` on root Text elements, so the browser
 * handles direction detection without JavaScript.
 */
export function isRTLText(_text: string) {
  return false
}
