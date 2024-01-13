import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {ButtonText} from '#/components/Button'
import {Link} from '#/components/Link'
import {H1, H3} from '#/components/Typography'

export function Links() {
  return (
    <View style={[a.gap_md, a.align_start]}>
      <H1>Links</H1>

      <View style={[a.gap_md, a.align_start]}>
        <Link
          accessibilityLabel="Click here"
          accessibilityHint="Opens something"
          to="https://blueskyweb.xyz"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          External
        </Link>
        <Link
          accessibilityLabel="Click here"
          accessibilityHint="Opens something"
          to="https://blueskyweb.xyz"
          style={[a.text_md]}>
          <H3>External with custom children</H3>
        </Link>
        <Link
          accessibilityLabel="Click here"
          accessibilityHint="Opens something"
          to="https://blueskyweb.xyz"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          https://blueskyweb.xyz
        </Link>
        <Link
          accessibilityLabel="Click here"
          accessibilityHint="Opens something"
          to="https://bsky.app/profile/bsky.app"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          Internal
        </Link>

        <Link
          accessibilityLabel="Click here"
          accessibilityHint="Opens something"
          variant="solid"
          color="primary"
          size="large"
          to="https://bsky.app/profile/bsky.app">
          {({props}) => <ButtonText {...props}>Link as a button</ButtonText>}
        </Link>
      </View>
    </View>
  )
}
