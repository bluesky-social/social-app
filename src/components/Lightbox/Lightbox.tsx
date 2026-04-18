// On native the lightbox is presented as a transparentModal screen
// (see src/screens/Lightbox/index.tsx) so that react-native-screens can
// allow per-screen orientation. The shell-level <Lightbox /> therefore
// renders nothing on native — the route handles mounting the viewer.
export function Lightbox() {
  return null
}
