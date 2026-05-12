import {lazy, Suspense} from 'react'

import * as Layout from '#/components/Layout'

const DebugComposer = lazy(() => import('./DebugComposer'))

export function DebugComposerScreen() {
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
        <Suspense fallback={null}>
          <DebugComposer />
        </Suspense>
      </Layout.Content>
    </Layout.Screen>
  )
}
