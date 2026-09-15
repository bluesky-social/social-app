import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {Pager} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme, web} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {TimelineRow} from './components/TimelineRow'
import {buildActivityListItems} from './model'
import {buildActivityPresentationListItems} from './presentation'
import {useAtmosphereQuery} from './query'
import {
  type ActivityTimelineListItem,
  buildActivityTimelineItems,
} from './timeline'
import {useTimelineNow} from './useTimelineNow'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Atmosphere'>

export function AtmosphereScreen({}: Props) {
  const t = useTheme()
  const {t: l} = useLingui()
  const sections = [
    {title: l`Activity`, component: <AtmosphereList />},
    {title: l`Explore`, component: <AtmosphereExplore />},
  ]

  return (
    <Layout.Screen testID="atmosphereScreen">
      <Pager
        testID="atmospherePager"
        initialPage={0}
        renderTabBar={props => (
          <Layout.Center style={[a.z_10, web([a.sticky, {top: 0}])]}>
            <Layout.Header.Outer noBottomBorder>
              <Layout.Header.BackButton />
              <Layout.Header.Content>
                <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <Layout.Header.TitleText>
                    <Trans>Atmosphere</Trans>
                  </Layout.Header.TitleText>
                  <View
                    testID="atmosphereBetaBadge"
                    style={[a.flex_row, a.align_center, a.gap_xs]}>
                    <SparkleIcon
                      accessible={false}
                      fill={t.palette.primary_800}
                      size="sm"
                    />
                    <Text
                      style={[
                        a.font_semi_bold,
                        {color: t.palette.primary_800},
                      ]}>
                      <Trans>Beta</Trans>
                    </Text>
                  </View>
                </View>
              </Layout.Header.Content>
              <Layout.Header.Slot />
            </Layout.Header.Outer>
            <TabBar
              testID="atmosphereTabBar"
              items={sections.map(section => section.title)}
              {...props}
            />
          </Layout.Center>
        )}>
        {sections.map(section => (
          <View key={section.title} style={a.flex_1}>
            {section.component}
          </View>
        ))}
      </Pager>
    </Layout.Screen>
  )
}

function AtmosphereExplore() {
  return (
    <View
      testID="atmosphereExplore"
      style={[a.flex_1, a.align_center, a.justify_center]}>
      <Text emoji style={a.text_md}>
        (╯°□°)╯︵ ┻━┻
      </Text>
    </View>
  )
}

function AtmosphereList() {
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const query = useAtmosphereQuery()
  const now = useTimelineNow()
  const items = buildActivityListItems(
    query.data,
    query.error ? cleanError(query.error) : undefined,
  )
  const timelineItems = buildActivityTimelineItems(
    buildActivityPresentationListItems(items),
    now,
  )
  const hasActivityRows = timelineItems.some(item => item.layout)

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await query.refetch()
    } finally {
      setIsPTRing(false)
    }
  }

  const onEndReached = async () => {
    if (
      query.isFetchingNextPage ||
      !query.hasNextPage ||
      query.error ||
      !hasActivityRows
    ) {
      return
    }
    try {
      await query.fetchNextPage()
    } catch {}
  }

  return (
    <List
      testID="atmosphereList"
      data={timelineItems}
      contentContainerStyle={{paddingBottom: 24}}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      refreshing={isPTRing}
      onRefresh={() => void onRefresh()}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={4}
      ListFooterComponent={
        hasActivityRows ? (
          <ListFooter
            isFetchingNextPage={query.isFetchingNextPage}
            hasNextPage={query.hasNextPage}
            error={query.error ? cleanError(query.error) : undefined}
            onRetry={query.fetchNextPage}
          />
        ) : undefined
      }
      initialNumToRender={initialNumToRender}
      windowSize={9}
      maxToRenderPerBatch={IS_IOS ? 5 : 1}
      updateCellsBatchingPeriod={40}
      sideBorders={false}
    />
  )
}

function AtmosphereLoading() {
  return (
    <View style={[a.w_full, a.align_center, a.py_5xl]}>
      <Loader size="xl" />
    </View>
  )
}

function AtmosphereEmpty() {
  const {t: l} = useLingui()
  return (
    <EmptyState
      icon={AtomIcon}
      message={l`There’s no activity to show yet.`}
      testID="atmosphereEmptyState"
    />
  )
}

function AtmosphereError({error}: {error: string}) {
  const {t: l} = useLingui()
  const query = useAtmosphereQuery()

  return (
    <EmptyState
      icon={AtomIcon}
      message={l`Unable to load activity: ${error}`}
      testID="atmosphereErrorState"
      button={{
        label: l`Retry loading activity`,
        text: l`Retry`,
        onPress: () => void query.refetch(),
        size: 'small',
        color: 'secondary',
      }}
    />
  )
}

function renderItem({item}: {item: ActivityTimelineListItem}) {
  switch (item.item.type) {
    case 'loading':
      return <AtmosphereLoading />
    case 'empty':
      return <AtmosphereEmpty />
    case 'error':
      return <AtmosphereError error={item.item.error} />
    case 'activity':
    case 'group':
      return item.computedItemView && item.layout ? (
        <TimelineRow
          item={item.item}
          computedItemView={item.computedItemView}
          layout={item.layout}
        />
      ) : null
  }
}

const keyExtractor = (item: ActivityTimelineListItem) => item.item.key
