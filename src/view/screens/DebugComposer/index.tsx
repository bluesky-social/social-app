import {lazy, Suspense} from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {useDevMode} from '#/storage/hooks/dev-mode'

const DebugComposer = lazy(() => import('./DebugComposer'))

export function DebugComposerScreen() {
  const [devMode] = useDevMode()
  const enabled = __DEV__ || devMode

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Composer V2</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content keyboardShouldPersistTaps="handled">
        {enabled ? (
          <Suspense fallback={null}>
            <DebugComposer />
          </Suspense>
        ) : (
          <View style={[a.p_xl]}>
            <Text>The Composer V2 tester requires developer mode.</Text>
          </View>
        )}
      </Layout.Content>
    </Layout.Screen>
  )
}
