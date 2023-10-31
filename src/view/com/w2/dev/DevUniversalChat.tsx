import React from 'react'
import {View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {Text} from '../../util/text/Text'
import {s} from 'lib/styles'

import {
  FakeUniversalInput,
  UniversalInput,
} from 'view/com/wingman/UniversalInput'
import {SparkleButton} from 'view/com/wingman/SparkleButton'
import {SuggestionList} from '../../wingman/Suggestions'

export function DevUniversalChat() {
  const dummySuggestions = [
    'What else is new?',
    'Where can I learn more?',
    'Show me more like this',
  ]

  return (
    <View>
      <Heading label="Sparkle Button" />
      <SparkleButton />
      <Divider />
      <Heading label="Fake Waverly Chat Bar Button" />
      <Divider />
      <FakeUniversalInput placeholder="Tell Waverly..." />
      <Heading label="Waverly Chat Bar" />
      <Divider />
      <UniversalInput placeholder="Tell Waverly..." onSubmit={() => {}} />
      <Divider height={8} />
      <SuggestionList suggestions={dummySuggestions} onPress={() => {}} />
    </View>
  )
}

function Heading({label}: {label: string}) {
  const pal = usePalette('default')
  return (
    <View style={[s.pt10, s.pb5]}>
      <Text type="title-lg" style={pal.text}>
        {label}
      </Text>
    </View>
  )
}
function Divider({height = 4}: {height?: number}) {
  const style = {height}
  return <View style={style} />
}
