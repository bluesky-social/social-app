import {lazy, Suspense, useState} from 'react'
import {View} from 'react-native'

import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {ThemeMenu} from '#/view/screens/Storybook/ThemeMenu'
import {atoms as a, useTheme, web} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {IS_IPAD} from '#/env'

const PAGES = [
  {title: 'Foundations', component: lazy(() => import('./FoundationsPage'))},
  {title: 'Components', component: lazy(() => import('./ComponentsPage'))},
  {
    title: 'Overlays & feedback',
    component: lazy(() => import('./OverlaysFeedbackPage')),
  },
  {
    title: 'Screens & patterns',
    component: lazy(() => import('./ScreensPatternsPage')),
  },
  {title: 'Device & tools', component: lazy(() => import('./DeviceToolsPage'))},
]

export default function Storybook() {
  const t = useTheme()
  const [selectedPage, setSelectedPage] = useState(0)
  const [visitedPages, setVisitedPages] = useState(() => new Set([0]))

  function visitPage(index: number) {
    setVisitedPages(current => {
      if (current.has(index)) return current
      return new Set([...current, index])
    })
  }

  return (
    <Pager
      testID="storybookPager"
      onTabPressed={visitPage}
      onPageSelected={index => {
        visitPage(index)
        setSelectedPage(index)
      }}
      renderTabBar={({tabBarAnchor, ...props}) => (
        <>
          {tabBarAnchor}
          <Layout.Center
            style={[a.z_10, t.atoms.bg, web([a.sticky, {top: 0}])]}>
            <Layout.Header.Outer sticky={false}>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <Layout.Header.TitleText>Storybook</Layout.Header.TitleText>
              </Layout.Header.Content>
              <Layout.Header.Slot>
                <ThemeMenu />
              </Layout.Header.Slot>
            </Layout.Header.Outer>
            <TabBar
              {...props}
              testID="storybookTabs"
              items={PAGES.map(page => page.title)}
              align="left"
            />
          </Layout.Center>
        </>
      )}>
      {PAGES.map(({title, component: Page}, index) => (
        <View
          key={title}
          style={a.flex_1}
          accessibilityElementsHidden={selectedPage !== index}
          importantForAccessibility={
            selectedPage === index ? 'auto' : 'no-hide-descendants'
          }>
          <Layout.Content
            testID={`storybookPage-${index}`}
            keyboardShouldPersistTaps="handled"
            scrollsToTop={selectedPage === index && !IS_IPAD}>
            <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 100}]}>
              {visitedPages.has(index) && (
                <Suspense fallback={<PageLoading />}>
                  <Page />
                </Suspense>
              )}
            </View>
          </Layout.Content>
        </View>
      ))}
    </Pager>
  )
}

function PageLoading() {
  return (
    <View
      style={[a.align_center, a.py_5xl]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading stories"
      accessibilityHint="">
      <Loader size="xl" />
    </View>
  )
}
