import {StyleSheet, View} from 'react-native'

import {atoms as a, useTheme, type ViewStyleProp, web as webOnly} from '#/alf'
import {IS_WEB, IS_WEB_TOUCH_DEVICE} from '#/env'

/**
 * A subtle highlight over its parent while the parent is hovered. It's
 * absolutely positioned, so render it as a direct child of the element it
 * highlights.
 *
 * On web it's driven by CSS: a rule in `src/style.css` shows it while its
 * parent is `:hover`, so the parent doesn't need hover state and doesn't
 * re-render on hover. On native, where it's opt-in with `native`, pass `hover`.
 */
export function SubtleHover({
  style,
  hover = false,
  disabled = false,
  web = true,
  native = false,
}: ViewStyleProp & {
  /**
   * Native only: whether the parent is hovered (or pressed). Ignored on web,
   * where CSS tracks hover.
   */
  hover?: boolean
  /**
   * Hides the highlight on every platform, e.g. while a nested control shows
   * a hover state of its own.
   */
  disabled?: boolean
  web?: boolean
  native?: boolean
}) {
  const t = useTheme()

  if (IS_WEB) {
    if (!web || IS_WEB_TOUCH_DEVICE) return null
    return (
      <View
        // @ts-expect-error web only, for the SubtleHover rule in style.css
        dataSet={disabled ? undefined : {subtleHover: t.name}}
        style={[
          a.absolute,
          a.inset_0,
          a.pointer_events_none,
          a.transition_opacity,
          t.atoms.bg_contrast_50,
          style,
          // Force Safari to composite the overlay on its own GPU layer.
          // This fixes a layout shift that happens due to different subpixel
          // rounding when the overlay is composited on hover.
          webOnly({willChange: 'opacity'}),
          styles.hidden,
        ]}
      />
    )
  }

  if (!native) return null

  let opacity: number
  switch (t.name) {
    case 'dark':
      opacity = 0.4
      break
    case 'dim':
      opacity = 0.45
      break
    case 'light':
      opacity = 0.5
      break
  }

  return (
    <View
      style={[
        a.absolute,
        a.inset_0,
        a.pointer_events_none,
        a.transition_opacity,
        t.atoms.bg_contrast_50,
        style,
        {opacity: hover && !disabled ? opacity : 0},
      ]}
    />
  )
}

const styles = StyleSheet.create({
  /*
   * A class rather than an inline style, so that the `:hover` rule in
   * `src/style.css` can override it
   */
  hidden: {opacity: 0},
})
