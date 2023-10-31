import React from 'react'
import {observer} from 'mobx-react-lite'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useStyle} from 'lib/hooks/waverly/useStyle'

interface Props {
  children?: React.ReactNode
}
export const WaverlyScreenPadding = observer(function WaverlyScreenPadding({
  children,
}: Props) {
  const safeAreaInsets = useSafeAreaInsets()
  const containerPadding = useStyle(
    () => ({
      position: 'absolute',
      top: safeAreaInsets.top,
      left: 0,
      right: 0,
      bottom: 0,
    }),
    [safeAreaInsets.top],
  )
  return <View style={containerPadding}>{children}</View>
})
