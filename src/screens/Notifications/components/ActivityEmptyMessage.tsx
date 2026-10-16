import {PixelRatio} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {atoms as a, useAlf, useTheme} from '#/alf'
import {useNativeFontScale} from '#/alf/util/dimensions'
import {BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon} from '#/components/icons/Bell'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

/**
 * The bell's size as a fraction of the font size. The bell is drawn in the
 * middle 20 of the icon's 24 units, so at this size it stands about as tall as
 * a capital letter.
 */
const BELL_EM = 0.875

/**
 * The Activity tab's empty state, which points to the bell on a profile that
 * subscribes to someone's activity, drawn inline as that profile button draws
 * it.
 */
export function ActivityEmptyMessage() {
  const t = useTheme()
  const {fonts} = useAlf()
  const nativeFontScale = useNativeFontScale()
  const color = t.atoms.text_contrast_medium.color
  /*
   * An icon inside text is a view, so it doesn't scale with the text. Size it
   * the way the text is sized: by the app's font size setting, then by the
   * system's.
   */
  const bellSize = PixelRatio.roundToNearestPixel(
    a.text_md.fontSize * fonts.scaleMultiplier * nativeFontScale * BELL_EM,
  )
  /*
   * Every platform puts the bottom of an icon inside text on the baseline, so
   * it sits on the line like a letter at any font size, with no nudging. On
   * Android and web that's how inline views and SVGs are laid out. iOS lays
   * them out below the baseline since React Native 0.82, but the bell renders
   * as a nano-icons glyph there, which corrects for that. A nudge would be
   * corrected away too.
   */
  const bell = <BellPlusIcon width={bellSize} fill={color} />

  return (
    <Text style={[a.text_md, a.leading_snug, a.text_center, {color}]}>
      {IS_WEB ? (
        <Trans>
          No posts here yet. Click the {bell} bell icon on someone’s profile to
          keep up with their activity.
        </Trans>
      ) : (
        <Trans>
          No posts here yet. Tap the {bell} bell icon on someone’s profile to
          keep up with their activity.
        </Trans>
      )}
    </Text>
  )
}
