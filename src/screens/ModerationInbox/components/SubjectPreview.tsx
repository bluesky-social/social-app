import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

// TODO These are placeholder values. -dsb
const POSTED_AT = new Date(2026, 7, 8)

export function SubjectPreview() {
  const t = useTheme()
  const {i18n} = useLingui()

  // TODO These are placeholder values. -dsb
  const handle = '@deleteme01.bsky.social'
  const post = '@deleteme01.bsky.social lorem ipsum dolor sit amet…'

  return (
    <View
      style={[
        a.p_lg,
        a.gap_sm,
        a.rounded_md,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
      ]}>
      <Text emoji style={[a.text_md, a.font_semi_bold]}>
        <Trans>Reply to {handle}</Trans>
      </Text>
      <Text emoji style={[a.text_md]}>
        <Trans>“{post}”</Trans>
      </Text>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
        <Trans>
          Posted{' '}
          {i18n.date(POSTED_AT, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Trans>
      </Text>
      <View style={[a.align_start]}>
        {/* TODO This is a placeholder for a button. -dsb */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[a.py_sm, a.px_md, a.rounded_full, t.atoms.bg_contrast_50]}>
          <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
            <Trans>Open post</Trans>
          </Text>
        </View>
      </View>
    </View>
  )
}
