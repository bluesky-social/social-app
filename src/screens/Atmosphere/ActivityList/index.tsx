import {useState} from 'react'
import {View} from 'react-native'
import {type AtUriString} from '@atproto/syntax'
import {Trans, useLingui} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {
  ActivityContentCard,
  ActivityWarning,
} from '#/screens/Atmosphere/ActivityTab/components/ActivityRow'
import {toActivityListContent} from '#/screens/Atmosphere/ActivityTab/rows'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {parseActivityListUris} from './links'
import {
  type ActivityListPage,
  useActivityListQuery,
} from './useActivityListQuery'

type Item = ActivityListPage['items'][number]

/** Every activity in an actor group ("View all"), as stacked cards. */
export function AtmosphereActivityListScreen({
  route: {
    params: {uris},
  },
}: NativeStackScreenProps<CommonNavigatorParams, 'AtmosphereActivityList'>) {
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
  const items = data?.pages.flatMap(page => page.items) ?? []

  async function onRefresh() {
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
        onPressTryAgain={() => void refetch()}
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
      renderItem={({item}: {item: Item}) => <ActivityListItem item={item} />}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          error={isError ? cleanError(error) : undefined}
          onRetry={() => fetchNextPage()}
        />
      }
      sideBorders={false}
    />
  )
}

function ActivityListItem({item}: {item: Item}) {
  const t = useTheme()
  const content = toActivityListContent(item.uri, item.view)
  return (
    <View style={[a.p_lg, a.border_b, t.atoms.border_contrast_low]}>
      {content ? (
        <ActivityContentCard content={content} />
      ) : (
        <ActivityWarning />
      )}
    </View>
  )
}
