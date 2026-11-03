import {useEffect, useState} from 'react'
import {RefreshControl, View} from 'react-native'
import {useSharedValue, withTiming} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {getAtmosphereApps} from '#/screens/Atmosphere/data/exploreData'
import {useAtmosphereAppsQuery} from '#/screens/Atmosphere/data/useAtmosphereAppsQuery'
import {TabPills} from '#/screens/Notifications/components/TabPills'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {AppCard} from './components/AppCard'

export function AtmosphereAppsTab() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {data, isError, isPending, refetch} = useAtmosphereAppsQuery()
  const [selectedKey, setSelectedKey] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const dragProgress = useSharedValue(0)

  /** Keys other than `all` are the category values sent by the backend. */
  const categoryDefinitions = [
    {key: 'all', label: l`All`},
    {key: 'writing', label: l`Blogging`},
    {key: 'photography', label: l`Photo`},
    {key: 'video', label: l`Video`},
    {key: 'games', label: l`Games`},
    {key: 'feeds', label: l`Feeds`},
    {key: 'social', label: l`Social`},
    {key: 'dev', label: l`Dev`},
    {key: 'audio', label: l`Audio`},
    {key: 'events', label: l`Events`},
    {key: 'utils', label: l`Utils`},
  ]
  /*
   * Only show categories with at least one renderable app. All is always
   * shown and keeps apps with a missing or unknown category.
   */
  const categories = categoryDefinitions.filter(
    ({key}) =>
      key === 'all' || (data && getAtmosphereApps(data, key).length > 0),
  )
  const selectedIndex = categories.findIndex(({key}) => key === selectedKey)

  /*
   * Keeps the indicator on the selected pill, including when a refresh
   * removes categories before it, and returns to All if the selected category
   * itself disappears.
   */
  useEffect(() => {
    dragProgress.set(withTiming(Math.max(0, selectedIndex)))
    if (selectedIndex === -1) setSelectedKey('all')
  }, [selectedIndex, dragProgress])

  async function onRefresh() {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
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

  const activeKey = selectedIndex === -1 ? 'all' : selectedKey
  const apps = getAtmosphereApps(
    data,
    activeKey === 'all' ? undefined : activeKey,
  )

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
          selectedTab={activeKey}
          dragProgress={dragProgress}
          onSelectTab={setSelectedKey}
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
