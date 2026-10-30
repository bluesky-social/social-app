import {Trans} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function BetaTag({
  label,
}: {
  /** Overrides the default "Beta" label, e.g. with "Experimental". */
  label?: string
}) {
  const t = useTheme()

  return (
    <Text
      style={[
        a.rounded_full,
        a.px_sm,
        a.text_xs,
        a.font_semi_bold,
        {
          backgroundColor: t.palette.primary_100,
          color: t.palette.primary_600,
          paddingTop: 3,
          paddingBottom: 3,
        },
      ]}>
      {label ?? <Trans>Beta</Trans>}
    </Text>
  )
}
