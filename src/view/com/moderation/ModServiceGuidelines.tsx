import React from 'react'
import {View} from 'react-native'
import {Text} from '../util/text/Text'
import {usePalette} from '#/lib/hooks/usePalette'

export function ModServiceGuidelines({}: {}) {
  const pal = usePalette('default')

  return (
    <View testID="modServiceGuidelines">
      <View
        style={[
          pal.border,
          {paddingHorizontal: 14, paddingBottom: 8, borderBottomWidth: 1},
        ]}>
        <Text type="2xl-bold">Guidelines</Text>
      </View>
      <View style={{paddingHorizontal: 14, paddingVertical: 8}}>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          These rules will evolve over time as we continually work to cultivate
          a healthy and thriving community. Do not:
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          1. Praise or promote material from hate groups or U.S., Canadian, and
          E.U. proscribed terror groups.
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          2. Distribute child sexual abuse material
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          3. Engage in human trafficking or sexual exploitation, including any
          attempt to distribute, participate or normalize child sexual abuse
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          4. Trade in illegal goods or substances
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          5. Steal or distribute others’ private personal information without
          their permission
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          6. Hack or access systems that you aren’t authorized to access
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          7. Scam or cheat others for financial gain h. Spam, phish, or
          otherwise use technical means to disrupt the experience of others on
          Bluesky Social
        </Text>
        <Text type="lg" style={pal.text} lineHeight={1.4}>
          8. Infringe other’s copyrights, trademarks and/or other intellectual
          property
        </Text>
      </View>
    </View>
  )
}
