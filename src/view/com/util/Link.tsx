import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  Linking,
  GestureResponderEvent,
  Platform,
  StyleProp,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {useLinkProps, useNavigation} from '@react-navigation/native'
import {Text} from './text/Text'
import {TypographyVariant} from 'lib/ThemeContext'
import {NavigationProp} from 'lib/routes/types'
import {matchPath} from '../../../Routes'
import {useStores, RootStoreModel} from 'state/index'
import {convertBskyAppUrlIfNeeded} from 'lib/strings/url-helpers'

type Event =
  | React.MouseEvent<HTMLAnchorElement, MouseEvent>
  | GestureResponderEvent

export const Link = observer(function Link({
  style,
  href,
  title,
  children,
  noFeedback,
}: {
  style?: StyleProp<ViewStyle>
  href?: string
  title?: string
  children?: React.ReactNode
  noFeedback?: boolean
}) {
  let {...props} = useLinkProps({to: href || ''})
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  props.onPress = React.useCallback(
    (e?: Event) => {
      if (typeof href === 'string') {
        return onPressInner(store, navigation, href, e)
      }
    },
    [store, navigation, href],
  )

  if (noFeedback) {
    return (
      <TouchableWithoutFeedback {...props}>
        <View style={style} {...props}>
          {children ? children : <Text>{title || 'link'}</Text>}
        </View>
      </TouchableWithoutFeedback>
    )
  }
  return (
    <TouchableOpacity style={style} {...props}>
      {children ? children : <Text>{title || 'link'}</Text>}
    </TouchableOpacity>
  )
})

export const TextLink = observer(function TextLink({
  type = 'md',
  style,
  href,
  text,
}: {
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  href: string
  text: string
}) {
  const {...props} = useLinkProps({to: href})
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()

  props.onPress = React.useCallback(
    (e?: Event) => {
      return onPressInner(store, navigation, href, e)
    },
    [store, navigation, href],
  )

  return (
    <Text type={type} style={style} {...props}>
      {text}
    </Text>
  )
})

// NOTE
// we can't use the onPress given by useLinkProps because it will
// match most paths to the HomeTab routes while we actually want to
// preserve the tab the app is currently in
//
// we also have some additional behaviors - closing the current modal,
// converting bsky urls, and opening http/s links in the system browser
//
// this method copies from the onPress implementation but adds our
// needed customizations
// -prf
function onPressInner(
  store: RootStoreModel,
  navigation: NavigationProp,
  href: string,
  e?: Event,
) {
  let shouldHandle = false

  if (Platform.OS !== 'web' || !e) {
    shouldHandle = e ? !e.defaultPrevented : true
  } else if (
    !e.defaultPrevented && // onPress prevented default
    // @ts-ignore Web only -prf
    !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) && // ignore clicks with modifier keys
    // @ts-ignore Web only -prf
    (e.button == null || e.button === 0) && // ignore everything but left clicks
    // @ts-ignore Web only -prf
    [undefined, null, '', 'self'].includes(e.currentTarget?.target) // let browser handle "target=_blank" etc.
  ) {
    e.preventDefault()
    shouldHandle = true
  }

  if (shouldHandle) {
    href = convertBskyAppUrlIfNeeded(href)
    if (href.startsWith('http')) {
      Linking.openURL(href)
    } else {
      store.shell.closeModal() // close any active modals

      const {name, params} = matchPath(href)
      // @ts-ignore we're not able to type check on this one -prf
      navigation.push(name, params)
    }
  }
}
