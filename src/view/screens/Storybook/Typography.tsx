import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

export function Typography() {
  return (
    <View style={[a.gap_md]}>
      <Text selectable style={[a.text_5xl]}>
        atoms.text_5xl
      </Text>
      <Text style={[a.text_4xl]}>atoms.text_4xl</Text>
      <Text style={[a.text_3xl]}>atoms.text_3xl</Text>
      <Text style={[a.text_2xl]}>atoms.text_2xl</Text>
      <Text style={[a.text_xl]}>atoms.text_xl</Text>
      <Text style={[a.text_lg]}>atoms.text_lg</Text>
      <Text style={[a.text_md]}>atoms.text_md</Text>
      <Text style={[a.text_sm]}>atoms.text_sm</Text>
      <Text style={[a.text_xs]}>atoms.text_xs</Text>
      <Text style={[a.text_2xs]}>atoms.text_2xs</Text>

      <Text style={[a.text_xl]}>This is regular text</Text>
      <Text style={[a.text_xl, a.italic]}>This is regular italic text</Text>
      <Text style={[a.text_xl, a.font_medium]}>This is medium text</Text>
      <Text style={[a.text_xl, a.font_medium, a.italic]}>
        This is medium italic text
      </Text>
      <Text style={[a.text_xl, a.font_semi_bold]}>This is bold text</Text>
      <Text style={[a.text_xl, a.font_semi_bold, a.italic]}>
        This is bold italic text
      </Text>
      <Text style={[a.text_xl, a.font_bold]}>This is heavy text</Text>
      <Text style={[a.text_xl, a.font_bold, a.italic]}>
        This is heavy italic text
      </Text>

      <RichText
        // TODO: This only supports already resolved facets.
        // Resolving them on read is bad anyway.
        value={`This is rich text. It can have mentions like @bsky.app or links like https://bsky.social`}
      />
      <RichText
        selectable
        // TODO: This only supports already resolved facets.
        // Resolving them on read is bad anyway.
        value={`This is rich text. It can have mentions like @bsky.app or links like https://bsky.social`}
        style={[a.text_xl]}
      />
    </View>
  )
}
