import React from 'react'
import {View} from 'react-native'

import {useTheme, atoms as a} from '#/alf'
import {ButtonText} from '#/components/Button'
import {InlineLink, Link} from '#/components/Link'
import {H1, H3, Text} from '#/components/Typography'

export function Links() {
  const t = useTheme()
  return (
    <View style={[a.gap_md, a.align_start]}>
      <H1>Links</H1>

      <View style={[a.gap_md, a.align_start]}>
        <InlineLink
          to="https://blueskyweb.xyz"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          External
        </InlineLink>
        <InlineLink to="https://blueskyweb.xyz" style={[a.text_md]}>
          <H3>External with custom children</H3>
        </InlineLink>
        <InlineLink
          to="https://blueskyweb.xyz"
          warnOnMismatchingTextChild
          style={[a.text_lg]}>
          https://blueskyweb.xyz
        </InlineLink>
        <InlineLink
          to="https://bsky.app/profile/bsky.app"
          warnOnMismatchingTextChild
          style={[a.text_md]}>
          Internal
        </InlineLink>

        <Link
          variant="solid"
          color="primary"
          size="large"
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <ButtonText>Link as a button</ButtonText>
        </Link>

        <Link
          label="View @bsky.app's profile"
          to="https://bsky.app/profile/bsky.app">
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.gap_md,
              a.rounded_md,
              a.p_md,
              t.atoms.bg_contrast_25,
            ]}>
            <View
              style={[
                {width: 32, height: 32},
                a.rounded_full,
                t.atoms.bg_contrast_200,
              ]}
            />
            <Text>View @bsky.app's profile</Text>
          </View>
        </Link>
      </View>
    </View>
  )
}
