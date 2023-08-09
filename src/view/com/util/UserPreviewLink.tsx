import React from 'react'
import {Pressable, StyleProp, ViewStyle} from 'react-native'
import {useStores} from 'state/index'
import {Link} from './Link'
import {isWeb} from 'platform/detection'
import {makeProfileLink} from 'lib/routes/links'

interface UserPreviewLinkProps {
  did: string
  handle: string
  style?: StyleProp<ViewStyle>
}
export function UserPreviewLink(
  props: React.PropsWithChildren<UserPreviewLinkProps>,
) {
  const store = useStores()

  if (isWeb) {
    return (
      <Link
        href={makeProfileLink(props)}
        title={props.handle}
        asAnchor
        style={props.style}>
        {props.children}
      </Link>
    )
  }
  return (
    <Pressable
      onPress={() =>
        store.shell.openModal({
          name: 'profile-preview',
          did: props.did,
        })
      }
      accessibilityRole="button"
      accessibilityLabel={props.handle}
      accessibilityHint=""
      style={props.style}>
      {props.children}
    </Pressable>
  )
}
