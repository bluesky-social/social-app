import React, {useContext, useMemo} from 'react'
import {View, ViewStyle} from 'react-native'
import {StyleProp} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import {ViewHeader} from '#/view/com/util/ViewHeader'
import {ScrollView} from '#/view/com/util/Views'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a} from '#/alf'

// Every screen should have a Layout component wrapping it.
// This component provides a default padding for the top of the screen.
// This allows certain screens to avoid the top padding if they want to.

const LayoutContext = React.createContext({
  withinScreen: false,
  topPaddingDisabled: false,
  withinScrollView: false,
})

/**
 * Every screen should have a Layout.Screen component wrapping it.
 * This component provides a default padding for the top of the screen
 * and height/minHeight
 */
let Screen = ({
  disableTopPadding = false,
  style,
  ...props
}: React.ComponentProps<typeof View> & {
  disableTopPadding?: boolean
  style?: StyleProp<ViewStyle>
}): React.ReactNode => {
  const {top} = useSafeAreaInsets()
  const context = useMemo(
    () => ({
      withinScreen: true,
      topPaddingDisabled: disableTopPadding,
      withinScrollView: false,
    }),
    [disableTopPadding],
  )
  return (
    <LayoutContext.Provider value={context}>
      <View
        style={[
          {paddingTop: disableTopPadding ? 0 : top},
          a.util_screen_outer,
          style,
        ]}
        {...props}
      />
    </LayoutContext.Provider>
  )
}
Screen = React.memo(Screen)
export {Screen}

let Header = (
  props: React.ComponentProps<typeof ViewHeader>,
): React.ReactNode => {
  const {withinScrollView} = useContext(LayoutContext)
  if (!withinScrollView) {
    return (
      <CenteredView topBorder={false} sideBorders>
        <ViewHeader showOnDesktop showBorder {...props} />
      </CenteredView>
    )
  } else {
    return <ViewHeader showOnDesktop showBorder {...props} />
  }
}
Header = React.memo(Header)
export {Header}

let Content = ({
  style,
  contentContainerStyle,
  ...props
}: React.ComponentProps<typeof ScrollView> & {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}): React.ReactNode => {
  const context = useContext(LayoutContext)
  const newContext = useMemo(
    () => ({...context, withinScrollView: true}),
    [context],
  )
  return (
    <LayoutContext.Provider value={newContext}>
      <ScrollView
        style={[a.flex_1, style]}
        contentContainerStyle={[{paddingBottom: 100}, contentContainerStyle]}
        {...props}
      />
    </LayoutContext.Provider>
  )
}
Content = React.memo(Content)
export {Content}
