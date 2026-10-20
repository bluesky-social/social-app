import {StyleSheet} from 'react-native'

import {usePalette} from '#/lib/hooks/usePalette'
import {emitNetworkRetry} from '#/state/events'
import {ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon} from '#/components/icons/ArrowRotate'
import {Button} from './forms/Button'
import {Text} from './text/Text'

export function LoadMoreRetryBtn({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  const pal = usePalette('default')
  return (
    <Button
      type="default-light"
      onPress={() => {
        /*
         * If we think we're offline, queries are paused and the retry would
         * silently do nothing. See `listenNetworkRetry`.
         */
        emitNetworkRetry()
        onPress()
      }}
      style={styles.loadMoreRetry}>
      <ArrowRotateIcon width={18} style={pal.textLight} />
      <Text style={[pal.textLight, styles.label]}>{label}</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  loadMoreRetry: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderRadius: 0,
    marginTop: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  label: {
    flex: 1,
  },
})
