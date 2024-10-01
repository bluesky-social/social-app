import React from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

// Every screen should have a Layout component wrapping it.
// This component provides a default padding for the top of the screen.
// This allows certain screens to avoid
//
// In a future PR I will add a unified header component to this file and
// things like a preconfigured scrollview.

let Screen = ({
  children,
  disableTopPadding,
}: {
  children: React.ReactNode
  disableTopPadding?: boolean
}): React.ReactNode => {
  const {top} = useSafeAreaInsets()
  return (
    <View style={{paddingTop: disableTopPadding ? 0 : top}}>{children}</View>
  )
}
Screen = React.memo(Screen)
export {Screen}
