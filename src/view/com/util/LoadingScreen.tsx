import {View} from 'react-native'

import {s} from '#/lib/styles'
import {CustomActivityIndicator} from '#/components/CustomActivityIndicator.tsx'
import * as Layout from '#/components/Layout'

/**
 * @deprecated use Layout compoenents directly
 */
export function LoadingScreen() {
  return (
    <Layout.Content>
      <View style={s.p20}>
        <CustomActivityIndicator size="large" />
      </View>
    </Layout.Content>
  )
}
