import {useWindowDimensions, View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'

export function ShowMoreButton({
  loading,
  onPress,
  postCount,
  bottomOffset = 0,
  kind = 'posts',
}: {
  loading: boolean
  onPress: () => void
  postCount: number
  bottomOffset?: number
  kind?: 'posts' | 'notifications'
}) {
  const {t: l} = useLingui()
  const label =
    kind === 'notifications'
      ? l`Show ${postCount} more notifications`
      : l`Show ${postCount} more posts`
  const {height} = useWindowDimensions()
  /*
   * At the end of the list, scrollable content stops at the bottom of the
   * viewport. Reserving the lower half of that viewport after this control
   * puts the button around its vertical centre instead of under the bottom
   * navigation UI.
   */
  const endPadding = Math.max(bottomOffset, height / 2 - 20)
  return (
    <View style={[a.align_center, a.py_lg, {paddingBottom: endPadding}]}>
      <Button
        testID="showMoreButton"
        label={label}
        onPress={onPress}
        disabled={loading}
        color="secondary"
        size="small">
        <ButtonText>{label}</ButtonText>
        {loading && <Loader size="sm" />}
      </Button>
    </View>
  )
}
