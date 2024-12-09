import {ActivityIndicator, View} from 'react-native'

import {s} from '#/lib/styles'
import * as Layout from '#/components/Layout'

/**
 * @deprecated use Layout compoenents directly
 */
export function LoadingScreen() {
  return (
    <Layout.Content>
      <View style={s.p20}>
        <ActivityIndicator size="large" />
      </View>
    </Layout.Content>
  )
}
