import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

/** Compact, text-labelled status used throughout the tester. */
export function StatusBadgeText({
  children,
  tone = 'neutral',
  testID,
}: {
  children: string
  tone?: 'neutral' | 'progress' | 'positive' | 'warning' | 'negative'
  testID?: string
}) {
  const t = useTheme()
  const colors = {
    neutral: {
      backgroundColor: t.palette.contrast_100,
      color: t.palette.contrast_800,
    },
    progress: {
      backgroundColor: t.palette.primary_50,
      color: t.palette.primary_700,
    },
    positive: {
      backgroundColor: t.palette.positive_50,
      color: t.palette.positive_700,
    },
    warning: {
      backgroundColor: t.scheme === 'dark' ? '#3A2C0E' : '#FFF2CE',
      color: t.scheme === 'dark' ? '#F2B533' : '#805900',
    },
    negative: {
      backgroundColor: t.palette.negative_50,
      color: t.palette.negative_700,
    },
  }[tone]

  return (
    <Text
      style={[
        a.text_xs,
        a.font_bold,
        a.rounded_full,
        {
          fontFamily: 'monospace',
          color: colors.color,
          backgroundColor: colors.backgroundColor,
          paddingHorizontal: 9,
          paddingVertical: 3,
          overflow: 'hidden',
        },
      ]}
      testID={testID}>
      {children}
    </Text>
  )
}
