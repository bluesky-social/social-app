import {ScrollProvider} from '#/lib/ScrollContext'
import {Context as AlfContext, useAlf} from '#/alf'
import {useThemeName} from '#/alf/util/useColorModeTheme'

/**
 * Dialog content renders where `Dialog.Outer` is declared rather than through
 * a portal at the app root, so it inherits the context around it. This resets
 * the context that should follow the app instead of the surrounding screen:
 *
 * - The theme. Some screens force their own, like the always-dark video feed,
 *   while the sheet itself is painted in the app theme.
 * - Scroll handlers. A list inside the dialog shouldn't drive the screen's
 *   scroll-linked UI, like the minimal shell.
 */
export function ContentBoundary({children}: {children: React.ReactNode}) {
  const alf = useAlf()
  const themeName = useThemeName()
  const value =
    alf.themeName === themeName
      ? alf
      : {...alf, themeName, theme: alf.themes[themeName]}

  return (
    <AlfContext value={value}>
      <ScrollProvider>{children}</ScrollProvider>
    </AlfContext>
  )
}
