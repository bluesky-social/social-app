import {useRef, useState} from 'react'
import {View} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {makeProfileLink} from '#/lib/routes/links'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {Pager, type PagerRef} from '#/view/com/pager/Pager'
import {TabBar} from '#/view/com/pager/TabBar'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme, web} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {RawActivityList} from './components/RawActivityList'
import {TimelineRow} from './components/TimelineRow'
import {AtmosphereAppsTab} from './AppsTab'
import {AtmosphereExploreTab} from './ExploreTab'
import {buildActivityListItems} from './model'
import {buildActivityPresentationListItems} from './presentation'
import {useAtmosphereQuery} from './query'
import {
  type ActivityTimelineListItem,
  buildActivityTimelineItems,
} from './timeline'
import {activityCollections, type ActivityOverflow} from './types'
import {useTimelineNow} from './useTimelineNow'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Atmosphere'>

/** Matches the Apps position in the sections below, including the Raw tab. */
const APPS_TAB_INDEX = 3

export function AtmosphereScreen({}: Props) {
  const t = useTheme()
  const {t: l} = useLingui()
  const pagerRef = useRef<PagerRef>(null)
  const sections = [
    {title: l`Activity`, component: <AtmosphereList />},
    {title: l`Raw`, component: <RawActivityList />},
    {
      title: l`Explore`,
      component: (
        <AtmosphereExploreTab
          onPressSeeMoreApps={() => pagerRef.current?.setPage(APPS_TAB_INDEX)}
        />
      ),
    },
    {title: l`Apps`, component: <AtmosphereAppsTab />},
  ]

  return (
    <Layout.Screen testID="atmosphereScreen">
      <Pager
        ref={pagerRef}
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
                    style={[
                      a.px_sm,
                      a.py_xs,
                      a.rounded_full,
                      {backgroundColor: t.palette.primary_100},
                    ]}>
                    <Text
                      style={[
                        a.text_xs,
                        a.font_semi_bold,
                        a.leading_tight,
                        {color: t.palette.primary_600},
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
  const hasActivityRows = timelineItems.some(
    item => item.layout || item.item.type === 'overflow',
  )

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
    case 'overflow':
      return <AtmosphereOverflow overflow={item.item.overflow} />
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

function AtmosphereOverflow({overflow}: {overflow: ActivityOverflow}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const count = overflow.count
  let label: string
  switch (overflow.collection) {
    case activityCollections.document:
      label = l`${plural(count, {one: '# more article', other: '# more articles'})}`
      break
    case activityCollections.publication:
      label = l`${plural(count, {one: '# more publication', other: '# more publications'})}`
      break
    case activityCollections.recommendation:
      label = l`${plural(count, {one: '# more recommendation', other: '# more recommendations'})}`
      break
    case activityCollections.subscription:
      label = l`${plural(count, {one: '# more subscription', other: '# more subscriptions'})}`
      break
    case activityCollections.livestream:
      label = l`${plural(count, {one: '# more livestream', other: '# more livestreams'})}`
      break
    case activityCollections.grainGallery:
      label = l`${plural(count, {one: '# more gallery', other: '# more galleries'})}`
      break
    case activityCollections.grainFavorite:
      label = l`${plural(count, {one: '# more favorite', other: '# more favorites'})}`
      break
    case activityCollections.share:
      label = l`${plural(count, {one: '# more post', other: '# more posts'})}`
      break
    default:
      label = l`${plural(count, {one: '# more activity', other: '# more activities'})}`
  }
  return (
    <View testID="atmosphereOverflowRow" style={[a.px_xl, a.py_md, a.gap_xs]}>
      <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>{label}</Text>
      {overflow.associatedProfiles.length > 0 ? (
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {overflow.associatedProfiles.map((profile, index) => (
            <InlineLinkText
              key={profile.did}
              to={makeProfileLink(profile)}
              label={l`View ${sanitizeHandle(profile.handle, '@')}’s profile`}
              style={[a.text_xs, t.atoms.text_contrast_medium]}>
              {index > 0 ? ', ' : ''}
              {sanitizeHandle(profile.handle, '@')}
            </InlineLinkText>
          ))}
        </Text>
      ) : null}
    </View>
  )
}

const keyExtractor = (item: ActivityTimelineListItem) => item.item.key
