import {emitNetworkRetry} from '#/state/events'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon} from '#/components/icons/Arrow'
import {Text} from '#/components/Typography'

export function LoadMoreRetryBtn({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <Button
      label={label}
      onPress={() => {
        /*
         * If we think we're offline, queries are paused and the retry would
         * silently do nothing. See `listenNetworkRetry`.
         */
        emitNetworkRetry()
        onPress()
      }}
      style={[
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.px_xl,
        a.py_md,
        a.border_t,
        t.atoms.bg,
        t.atoms.border_contrast_low,
      ]}
      hoverStyle={t.atoms.bg_contrast_25}>
      <ArrowRotateIcon size="md" fill={t.atoms.text_contrast_medium.color} />
      <Text
        style={[
          a.flex_1,
          a.text_md,
          a.leading_snug,
          t.atoms.text_contrast_medium,
        ]}>
        {label}
      </Text>
    </Button>
  )
}
