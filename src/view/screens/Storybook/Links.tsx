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
          to="https://blueskyweb.xyz"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          External
        </Link>
        <Link to="https://blueskyweb.xyz" style={[a.text_md]}>
          <H3>External with custom children</H3>
        </Link>
        <Link
          to="https://blueskyweb.xyz"
          warnOnMismatchingTextChild
          style={[a.text_lg]}>
          https://blueskyweb.xyz
        </Link>
        <Link
          to="https://bsky.app/profile/bsky.app"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          Internal
        </Link>

        <Link
          variant="solid"
          color="primary"
          size="large"
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <ButtonText>Link as a button</ButtonText>
        </Link>
      </View>
    </View>
  )
}
