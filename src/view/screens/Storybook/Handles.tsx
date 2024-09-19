import React from 'react'
import {View} from 'react-native'

import {HighlightedHandle} from '#/view/com/util/HighlightedHandle'
import {atoms as a, useTheme} from '#/alf'
import {H1, H2, Text} from '#/components/Typography'

export function Handles() {
  const t = useTheme()
  return (
    <View style={[a.gap_sm]}>
      <H1>Handles</H1>
      <H2 style={[a.pt_md]}>Under a Private Domain</H2>
      <HighlightedHandle handle="someone.bsky.social" />
      <HighlightedHandle handle="someone.another.social" />
      <HighlightedHandle handle="someone.github.io" />
      <HighlightedHandle handle="someone.somewebsite.com" />
      <HighlightedHandle handle="someone.sub.domain.social-provider.com" />
      <H2 style={[a.pt_md]}>Under an ICANN Domain</H2>
      <View style={[a.flex_row, a.justify_between]}>
        <HighlightedHandle handle="someone" />
        <Text style={{color: t.palette.primary_400}}>(Zero level)</Text>
      </View>
      <View style={[a.flex_row, a.justify_between]}>
        <HighlightedHandle handle="someone.com" />
        <Text style={{color: t.palette.primary_400}}>(One level)</Text>
      </View>
      <View style={[a.flex_row, a.justify_between]}>
        <HighlightedHandle handle="someone.co.uk" />
        <Text style={{color: t.palette.primary_400}}>(Two levels)</Text>
      </View>
      <View style={[a.flex_row, a.justify_between]}>
        <HighlightedHandle handle="someone.mg.gov.br" />
        <Text style={{color: t.palette.primary_400}}>(Three levels)</Text>
      </View>
      <H2 style={[a.pt_md]}>Spoof Detection</H2>
      <HighlightedHandle handle="someone.bsky.social.some-fake-domain.com" />
      <HighlightedHandle handle="someone.nytimes.com.some-fake-domain.com" />
      <HighlightedHandle handle="someone.nasa.gov.some-fake-domain.com" />
      <HighlightedHandle handle="someone.bsky.social.com" />
      <HighlightedHandle handle="someone.nytimes.com.com" />
      <HighlightedHandle handle="someone.nasa.gov.com" />
      <H2 style={[a.pt_md]}>Invalid</H2>
      <HighlightedHandle handle="handle.invalid" />
    </View>
  )
}
