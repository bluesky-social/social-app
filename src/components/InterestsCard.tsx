import {Image, View} from 'react-native'

import {Text} from '#/components/Typography'

export function InterestsCard({image}: any) {
  return (
    <>
      <View>
        <Image
          source={image}
          style={{width: 400, height: 400, borderRadius: 20}}
          accessibilityIgnoresInvertColors
        />
      </View>
      <View>
        <Text>Hi there</Text>
      </View>
    </>
  )
}
