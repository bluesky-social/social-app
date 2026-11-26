import {useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/**
 * Small muted details joined with " · ", led by a date like "Nov 21", with
 * the year when it isn't this year.
 */
export function MetaLine({
  date,
  details = [],
}: {
  /** An ISO datetime. Left out when missing or invalid. */
  date?: string
  /** Already formatted; falsy ones are left out. */
  details?: (string | false | undefined)[]
}) {
  const {i18n} = useLingui()
  const t = useTheme()

  const parsed = date ? new Date(date) : undefined
  const parts: string[] = []
  if (parsed && !Number.isNaN(parsed.getTime())) {
    parts.push(
      i18n.date(parsed, {
        month: 'short',
        day: 'numeric',
        year:
          parsed.getFullYear() === new Date().getFullYear()
            ? undefined
            : 'numeric',
      }),
    )
  }
  for (const detail of details) {
    if (detail) parts.push(detail)
  }
  if (parts.length === 0) return null

  return (
    <Text
      numberOfLines={1}
      style={[a.text_xs, a.leading_snug, t.atoms.text_contrast_medium]}>
      {parts.join(' · ')}
    </Text>
  )
}
