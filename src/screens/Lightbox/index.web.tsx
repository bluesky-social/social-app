// The native lightbox is presented as a transparentModal screen so that
// react-native-screens can manage per-screen orientation. On web the lightbox
// remains a global overlay (see src/view/com/lightbox/Lightbox.web.tsx) and
// this screen is never registered — this stub exists only to satisfy imports
// on the web bundler.
export function LightboxScreen() {
  return null
}
