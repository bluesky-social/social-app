import React from 'react'
import {View, ViewStyle} from 'react-native'
import {StyleProp} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {atoms as a, web} from '#/alf'

// Every screen should have a Layout component wrapping it.
// This component provides a default padding for the top of the screen.
// This allows certain screens to avoid the top padding if they want to.
//
// In a future PR I will add a unified header component to this file and
// things like a preconfigured scrollview.

/**
 * Every screen should have a Layout.Screen component wrapping it.
 * This component provides a default padding for the top of the screen
 * and height/minHeight
 */
let Screen = ({
  disableTopPadding,
  style,
  ...props
}: React.ComponentProps<typeof View> & {
  disableTopPadding?: boolean
  style?: StyleProp<ViewStyle>
}): React.ReactNode => {
  const {top} = useSafeAreaInsets()
  return (
    <View
      style={[
        {paddingTop: disableTopPadding ? 0 : top},
        a.util_screen_outer,
        web([{minHeight: 0}, a.flex_1]),
        style,
      ]}
      {...props}
    />
  )
}
Screen = React.memo(Screen)
export {Screen}
