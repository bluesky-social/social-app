import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {EmptyState} from '#/view/com/util/EmptyState'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Atom_Stroke2_Corner0_Rounded as AtomIcon} from '#/components/icons/Atom'
import * as Layout from '#/components/Layout'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type ActivityListItem, buildActivityListItems} from './model'
import {useActivityV2Query} from './query'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ActivityV2'>

export function ActivityV2Screen({}: Props) {
  return (
    <Layout.Screen testID="activityV2Screen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Activity V2</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <ActivityV2List />
    </Layout.Screen>
  )
}

function ActivityV2List() {
  const initialNumToRender = useInitialNumToRender()
  const [isPTRing, setIsPTRing] = useState(false)
  const query = useActivityV2Query()
  const items = buildActivityListItems(
    query.data,
    query.error ? cleanError(query.error) : undefined,
  )
  const hasActivityRows = items.some(
    item => item.type === 'activity' || item.type === 'group',
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
      data={items}
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

function ActivityV2PreviewRow({
  hideTopBorder,
  preview,
}: {
  hideTopBorder: boolean
  preview: string
}) {
  const t = useTheme()

  return (
    <View style={[!hideTopBorder && a.border_t, t.atoms.border_contrast_low]}>
      <View style={[a.px_xl, a.py_lg]}>
        <Text
          numberOfLines={1}
          style={[a.text_sm, a.leading_snug, t.atoms.text]}>
          {preview}
        </Text>
      </View>
    </View>
  )
}

function ActivityV2Loading() {
  return (
    <View style={[a.w_full, a.align_center, a.py_5xl]}>
      <Loader size="xl" />
    </View>
  )
}

function ActivityV2Empty() {
  const {t: l} = useLingui()
  return (
    <EmptyState
      icon={AtomIcon}
      message={l`There’s no activity to show yet.`}
      testID="activityV2EmptyState"
    />
  )
}

function ActivityV2Error({error}: {error: string}) {
  const {t: l} = useLingui()
  const query = useActivityV2Query()

  return (
    <EmptyState
      icon={AtomIcon}
      message={l`Unable to load activity: ${error}`}
      testID="activityV2ErrorState"
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

function renderItem({item, index}: {item: ActivityListItem; index: number}) {
  switch (item.type) {
    case 'loading':
      return <ActivityV2Loading />
    case 'empty':
      return <ActivityV2Empty />
    case 'error':
      return <ActivityV2Error error={item.error} />
    case 'activity':
      return (
        <ActivityV2PreviewRow
          hideTopBorder={index === 0}
          preview={JSON.stringify(item.activity) ?? ''}
        />
      )
    case 'group':
      return (
        <ActivityV2PreviewRow
          hideTopBorder={index === 0}
          preview={JSON.stringify(item.group) ?? ''}
        />
      )
  }
}

const keyExtractor = (item: ActivityListItem) => item.key
