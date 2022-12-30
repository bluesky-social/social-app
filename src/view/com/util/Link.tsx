import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  Linking,
  StyleProp,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {Text} from './text/Text'
import {TypographyVariant} from '../../lib/ThemeContext'
import {useStores, RootStoreModel} from '../../../state'
import {convertBskyAppUrlIfNeeded} from '../../../lib/strings'

export const Link = observer(function Link({
  style,
  href,
  title,
  children,
  noFeedback,
}: {
  style?: StyleProp<ViewStyle>
  href: string
  title?: string
  children?: React.ReactNode
  noFeedback?: boolean
}) {
  const store = useStores()
  const onPress = () => {
    handleLink(store, href, false)
  }
  const onLongPress = () => {
    handleLink(store, href, true)
  }
  if (noFeedback) {
    return (
      <TouchableWithoutFeedback
        onPress={onPress}
        onLongPress={onLongPress}
        delayPressIn={50}>
        <View style={style}>
          {children ? children : <Text>{title || 'link'}</Text>}
        </View>
      </TouchableWithoutFeedback>
    )
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayPressIn={50}
      style={style}>
      {children ? children : <Text>{title || 'link'}</Text>}
    </TouchableOpacity>
  )
})

export const TextLink = observer(function Link({
  type = 'body1',
  style,
  href,
  text,
}: {
  type?: TypographyVariant
  style?: StyleProp<TextStyle>
  href: string
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
    <Text type={type} style={style} onPress={onPress} onLongPress={onLongPress}>
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
