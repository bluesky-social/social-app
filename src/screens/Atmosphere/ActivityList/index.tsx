import {useState} from 'react'
import {View} from 'react-native'
import {type AtUriString} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'
import {useIsFocused} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {useAppState} from '#/lib/appState'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {NotFoundScreen} from '#/view/screens/NotFound'
import {ActivityContentHider} from '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider'
import {
  ActivityContentCard,
  ActivityWarning,
} from '#/screens/Atmosphere/ActivityTab/components/ActivityRow'
import {getContentMetricContextProps} from '#/screens/Atmosphere/metrics/content'
import {
  AtmosphereContentItem,
  AtmosphereMetricsScope,
  useLogContentImpression,
} from '#/screens/Atmosphere/metrics/context'
import {useLoadMetrics} from '#/screens/Atmosphere/metrics/useLoadMetrics'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {useAnalytics} from '#/analytics'
import {parseActivityListUris} from './links'
import {
  type ActivityListItem as Item,
  useActivityListQuery,
} from './useActivityListQuery'

/** What every activity in an actor group targets ("View all"), as cards. */
export function AtmosphereActivityListScreen({
  route: {
    params: {uris},
  },
}: NativeStackScreenProps<CommonNavigatorParams, 'AtmosphereActivityList'>) {
  const ax = useAnalytics()

  if (!ax.features.enabled(ax.features.AtmosphereScreenEnable)) {
    return <NotFoundScreen />
  }

  return (
    <Layout.Screen testID="atmosphereActivityListScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Activity</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <ActivityList uris={parseActivityListUris(uris)} />
    </Layout.Screen>
  )
}

function ActivityList({uris}: {uris: AtUriString[]}) {
  const isFocused = useIsFocused()
  const appState = useAppState()
  return (
    <AtmosphereMetricsScope
      surface="activityList"
      isActive={isFocused && appState !== 'background'}>
      <ActivityListContent uris={uris} />
    </AtmosphereMetricsScope>
  )
}

function ActivityListContent({uris}: {uris: AtUriString[]}) {
  const {t: l} = useLingui()
  const {
    data,
    error,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityListQuery(uris)
  const [isPTRing, setIsPTRing] = useState(false)
  const items = data?.pages.flat() ?? []
  const onItemSeen = useLogContentImpression(items, (item, position) => {
    if (!item.content || item.moderation.blur) return
    return {
      ...getContentMetricContextProps(item.content.type, item.content.view),
      position,
    }
  })
  const metrics = useLoadMetrics({
    hasData: !!data,
    isError,
    itemCount: items.length,
    pages: data?.pages,
  })

  async function onRefresh() {
    metrics.logRefresh()
    setIsPTRing(true)
    await refetch()
    setIsPTRing(false)
  }

  async function onEndReached() {
    if (isFetchingNextPage || !hasNextPage || isError) return
    await fetchNextPage()
  }

  if (!data) {
    return isError ? (
      <ErrorMessage
        message={l`Could not load activity. Please try again.`}
        onPressTryAgain={() => {
          metrics.logRetry('initial')
          void refetch()
        }}
      />
    ) : (
      <View style={[a.align_center, a.justify_center, a.py_5xl]}>
        <Loader size="xl" />
      </View>
    )
  }

  return (
    <List
      testID="atmosphereActivityList"
      data={items}
      keyExtractor={(item: Item, index: number) => `${item.uri}:${index}`}
      renderItem={({item, index}: {item: Item; index: number}) => (
        <ActivityListItem item={item} position={index} />
      )}
      onItemSeen={onItemSeen}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          error={isError ? cleanError(error) : undefined}
          onRetry={() => {
            metrics.logRetry('pagination')
            return fetchNextPage()
          }}
        />
      }
      sideBorders={false}
    />
  )
}

function ActivityListItem({item, position}: {item: Item; position: number}) {
  const t = useTheme()
  return (
    <View style={[a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      {item.content ? (
        <ActivityContentHider moderation={item.moderation}>
          <AtmosphereContentItem
            {...getContentMetricContextProps(
              item.content.type,
              item.content.view,
            )}
            position={position}>
            <ActivityContentCard content={item.content} />
          </AtmosphereContentItem>
        </ActivityContentHider>
      ) : (
        <ActivityWarning />
      )}
    </View>
  )
}
