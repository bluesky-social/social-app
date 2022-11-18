import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  StyleProp,
  Text,
  TouchableOpacity,
  TextStyle,
  ViewStyle,
} from 'react-native'
import {useStores} from '../../../state'
import {LinkActionsModel} from '../../../state/models/shell-ui'

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
    store.shell.closeModal() // close any active modals
    store.nav.navigate(href)
  }
  const onLongPress = () => {
    store.shell.closeModal() // close any active modals
    store.nav.newTab(href, title)
    // store.shell.openModal(new LinkActionsModel(href, title || href))
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
    store.shell.closeModal() // close any active modals
    store.nav.navigate(href)
  }
  const onLongPress = () => {
    store.shell.closeModal() // close any active modals
    store.nav.newTab(href, title)
  }
  return (
    <Text style={style} onPress={onPress} onLongPress={onLongPress}>
      {text}
    </Text>
  )
})
