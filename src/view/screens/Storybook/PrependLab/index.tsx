import {lazy, Suspense} from 'react'

import * as Layout from '#/components/Layout'

const PrependLab = lazy(() => import('./Lab'))

/**
 * An isolated reproduction of maintainVisibleContentPosition prepend failures
 * (Following v2, APP-3149). It is a route of its own rather than a Storybook
 * section because nested in Storybook's ScrollView the list would be a nested
 * VirtualizedList with no scroll view of its own, which is not what's under
 * test.
 */
export function PrependLabScreen() {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Prepend lab</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Suspense fallback={null}>
        <PrependLab />
      </Suspense>
    </Layout.Screen>
  )
}
