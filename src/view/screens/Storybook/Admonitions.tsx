import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {InlineLinkText} from '#/components/Link'
import {H1} from '#/components/Typography'

export function Admonitions() {
  return (
    <View style={[a.gap_md]}>
      <H1>Admonitions</H1>

      <Admonition>The quick brown fox jumps over the lazy dog.</Admonition>
      <Admonition type="info">
        How happy the blameless vestal's lot, the world forgetting by the world
        forgot.{' '}
        <InlineLinkText
          label="test"
          to="https://letterboxd.com/film/eternal-sunshine-of-the-spotless-mind/">
          Eternal sunshine of the spotless mind
        </InlineLinkText>
        ! Each pray'r accepted, and each wish resign'd.
      </Admonition>
      <Admonition type="tip">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
      <Admonition type="warning">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
      <Admonition type="error">
        The quick brown fox jumps over the lazy dog.
      </Admonition>
    </View>
  )
}
