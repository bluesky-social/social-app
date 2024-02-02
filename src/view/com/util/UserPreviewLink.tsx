import React from 'react'
import {Pressable, StyleProp, ViewStyle} from 'react-native'
import {Link} from './Link'
import {isAndroid, isWeb} from 'platform/detection'
import {makeProfileLink} from 'lib/routes/links'
import {useModalControls} from '#/state/modals'
import {usePrefetchProfileQuery} from '#/state/queries/profile'

interface UserPreviewLinkProps {
  did: string
  handle: string
  style?: StyleProp<ViewStyle>
}
export function UserPreviewLink(
  props: React.PropsWithChildren<UserPreviewLinkProps>,
) {
  const {openModal} = useModalControls()
  const prefetchProfileQuery = usePrefetchProfileQuery()

  if (isWeb || isAndroid) {
    return (
      <Link
        onPointerEnter={() => {
          if (isWeb) {
            prefetchProfileQuery(props.did)
          }
        }}
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
        openModal({
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
