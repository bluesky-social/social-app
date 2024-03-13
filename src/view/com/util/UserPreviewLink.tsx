import React from 'react'
import {StyleProp, ViewStyle} from 'react-native'
import {Link} from './Link'
import {makeProfileLink} from 'lib/routes/links'

interface UserPreviewLinkProps {
  did: string
  handle: string
  style?: StyleProp<ViewStyle>
}
export function UserPreviewLink(
  props: React.PropsWithChildren<UserPreviewLinkProps>,
) {
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
