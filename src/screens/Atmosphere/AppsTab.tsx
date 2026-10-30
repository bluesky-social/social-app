import {useState} from 'react'
import {RefreshControl, View} from 'react-native'
import {useSharedValue, withTiming} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {getAtmosphereApps} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereExploreQuery} from '#/screens/Atmosphere/data/useAtmosphereExploreQuery'
import {TabPills} from '#/screens/Notifications/components/TabPills'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {AppCard} from './components/AppCard'

export function AtmosphereAppsTab() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {data, isError, isPending, isRefetching, refetch} =
    useAtmosphereExploreQuery()
  const [selectedKey, setSelectedKey] = useState('all')
  const dragProgress = useSharedValue(0)

  /** Keys other than `all` are the category values sent by the backend. */
  const categories = [
    {key: 'all', label: l`All`},
    {key: 'writing', label: l`Blogging`},
    {key: 'photography', label: l`Photo`},
    {key: 'video', label: l`Video`},
    {key: 'games', label: l`Games`},
    {key: 'feeds', label: l`Feeds`},
  ]

  const refreshControl = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      tintColor={t.atoms.text.color}
      titleColor={t.atoms.text.color}
    />
  )

  const errorMessage = (
    <ErrorMessage
      message={l`Could not load Atmosphere content. Please try again.`}
      onPressTryAgain={() => void refetch()}
    />
  )

  if (!data) {
    return (
      <Layout.Content
        testID="atmosphereAppsTab"
        alwaysBounceVertical
        refreshControl={refreshControl}
        contentContainerStyle={[a.pb_xl]}>
        {isPending ? (
          <View
            testID="atmosphereAppsTabLoading"
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={l`Loading Atmosphere content`}
            accessibilityHint=""
            style={[a.align_center, a.justify_center, a.py_5xl]}>
            <Loader size="xl" />
          </View>
        ) : isError ? (
          errorMessage
        ) : undefined}
      </Layout.Content>
    )
  }

  const apps = getAtmosphereApps(
    data,
    selectedKey === 'all' ? undefined : selectedKey,
  )

  function onSelectCategory(key: string) {
    setSelectedKey(key)
    dragProgress.set(
      withTiming(categories.findIndex(category => category.key === key)),
    )
  }

  return (
    <Layout.Content
      testID="atmosphereAppsTab"
      alwaysBounceVertical
      refreshControl={refreshControl}
      contentContainerStyle={[a.pb_xl]}>
      <View style={[a.gap_lg, a.pt_lg]}>
        {isError ? <View style={[a.px_lg]}>{errorMessage}</View> : undefined}
        <TabPills
          tabs={categories}
          selectedTab={selectedKey}
          dragProgress={dragProgress}
          onSelectTab={onSelectCategory}
          getAccessibilityHint={tab => l`Shows ${tab.label} apps`}
        />
        <View style={[a.gap_md, a.px_lg]}>
          {apps.length ? (
            apps.map(app => <AppCard key={app.id} app={app} />)
          ) : (
            <Text
              style={[
                a.text_center,
                a.leading_snug,
                a.py_xl,
                t.atoms.text_contrast_medium,
              ]}>
              {l`No apps in this category yet.`}
            </Text>
          )}
        </View>
      </View>
    </Layout.Content>
  )
}
