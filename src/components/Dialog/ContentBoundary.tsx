import {ScrollProvider} from '#/lib/ScrollContext'

/**
 * Dialog content renders where `Dialog.Outer` is declared rather than through
 * a portal at the app root, so it inherits the context around it. This resets
 * the scroll handlers: a list inside the dialog shouldn't drive the screen's
 * scroll-linked UI, like the minimal shell.
 *
 * The theme is inherited on purpose. A dialog opened from a screen that forces
 * its own theme, like the always-dark video feed, matches that screen.
 */
export function ContentBoundary({children}: {children: React.ReactNode}) {
  return <ScrollProvider>{children}</ScrollProvider>
}
