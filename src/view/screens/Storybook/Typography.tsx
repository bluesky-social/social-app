import React from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Text, H1, H2, H3, H4, H5, H6, P} from '#/components/Typography'
import {RichText} from '#/components/RichText'

export function Typography() {
  return (
    <View style={[a.gap_md]}>
      <H1>H1 Heading</H1>
      <H2>H2 Heading</H2>
      <H3>H3 Heading</H3>
      <H4>H4 Heading</H4>
      <H5>H5 Heading</H5>
      <H6>H6 Heading</H6>
      <P>P Paragraph</P>

      <Text style={[a.text_5xl]}>atoms.text_5xl</Text>
      <Text style={[a.text_4xl]}>atoms.text_4xl</Text>
      <Text style={[a.text_3xl]}>atoms.text_3xl</Text>
      <Text style={[a.text_2xl]}>atoms.text_2xl</Text>
      <Text style={[a.text_xl]}>atoms.text_xl</Text>
      <Text style={[a.text_lg]}>atoms.text_lg</Text>
      <Text style={[a.text_md]}>atoms.text_md</Text>
      <Text style={[a.text_sm]}>atoms.text_sm</Text>
      <Text style={[a.text_xs]}>atoms.text_xs</Text>
      <Text style={[a.text_2xs]}>atoms.text_2xs</Text>

      <RichText
        resolveFacets
        value={`This is rich text. It can have mentions like @bsky.app or links like https://blueskyweb.xyz`}
      />
      <RichText
        resolveFacets
        value={`This is rich text. It can have mentions like @bsky.app or links like https://blueskyweb.xyz`}
        style={[a.text_xl]}
      />
    </View>
  )
}
