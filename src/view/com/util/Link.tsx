import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  Linking,
  StyleProp,
  Text,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
} from 'react-native'
import {useStores, RootStoreModel} from '../../../state'
import {convertBskyAppUrlIfNeeded} from '../../../lib/strings'

export const Link = observer(function Link({
  style,
  href,
  title,
  children,
}: {
  style?: StyleProp<ViewStyle>
  href: string
  title?: string
  children?: React.ReactNode
}) {
  const store = useStores()
  const onPress = () => {
    handleLink(store, href, false)
  }
  const onLongPress = () => {
    handleLink(store, href, true)
  }
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      onLongPress={onLongPress}
      delayPressIn={50}>
      {children ? children : <Text>{title || 'link'}</Text>}
    </TouchableOpacity>
  )
})

export const TextLink = observer(function Link({
  style,
  href,
  title,
  text,
}: {
  style?: StyleProp<TextStyle>
  href: string
  title?: string
  text: string
}) {
  const store = useStores()
  const onPress = () => {
    handleLink(store, href, false)
  }
  const onLongPress = () => {
    handleLink(store, href, true)
  }
  return (
    <Text style={style} onPress={onPress} onLongPress={onLongPress}>
      {text}
    </Text>
  )
})

function handleLink(store: RootStoreModel, href: string, longPress: boolean) {
  href = convertBskyAppUrlIfNeeded(href)
  if (href.startsWith('http')) {
    Linking.openURL(href)
  } else if (longPress) {
    store.shell.closeModal() // close any active modals
    store.nav.newTab(href)
  } else {
    store.shell.closeModal() // close any active modals
    store.nav.navigate(href)
  }
}
