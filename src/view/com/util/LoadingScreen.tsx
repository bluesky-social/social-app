import {ActivityIndicator, View} from 'react-native'

import {s} from '#/lib/styles'
import {CenteredView} from './Views'

export function LoadingScreen() {
  return (
    <CenteredView>
      <View style={s.p20}>
        <ActivityIndicator size="large" />
      </View>
    </CenteredView>
  )
}
