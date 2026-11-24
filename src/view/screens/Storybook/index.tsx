import {lazy, Suspense} from 'react'

import * as Layout from '#/components/Layout'

const Storybook = lazy(() => import('./Storybook'))

export function StorybookScreen() {
  return (
    <Layout.Screen testID="storybookScreen">
      <Suspense fallback={null}>
        <Storybook />
      </Suspense>
    </Layout.Screen>
  )
}
