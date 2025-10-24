import React, {type JSX} from 'react'
import {
  ActivityIndicator,
  FlatList as RNFlatList,
  RefreshControl,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {type AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {usePalette} from '#/lib/hooks/usePalette'
import {cleanError} from '#/lib/strings/errors'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type MyListsFilter, useMyListsQuery} from '#/state/queries/my-lists'
import {atoms as a, useTheme} from '#/alf'
import {BulletList_Stroke1_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import * as ListCard from '#/components/ListCard'
import {EmptyState} from '../util/EmptyState'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {List} from '../util/List'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}

export function MyLists({
  filter,
  inline,
  style,
  renderItem,
  testID,
}: {
  filter: MyListsFilter
  inline?: boolean
  style?: StyleProp<ViewStyle>
  renderItem?: (list: GraphDefs.ListView, index: number) => JSX.Element
  testID?: string
}) {
  const pal = usePalette('default')
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data, isFetching, isFetched, isError, error, refetch} =
    useMyListsQuery(filter)
  const isEmpty = !isFetching && !data?.length

  const items = React.useMemo(() => {
    let listItems: any[] = []
    if (isError && isEmpty) {
      listItems = listItems.concat([ERROR_ITEM])
    }
    if ((!isFetched && isFetching) || !moderationOpts) {
      listItems = listItems.concat([LOADING])
    } else if (isEmpty) {
      listItems = listItems.concat([EMPTY])
    } else {
      listItems = listItems.concat(data)
    }
    return listItems
  }, [isError, isEmpty, isFetched, isFetching, moderationOpts, data])

  // events
  // =

  const onRefresh = React.useCallback(async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh lists', {message: err})
    }
    setIsPTRing(false)
  }, [refetch, setIsPTRing])

  // rendering
  // =

  const renderItemInner = React.useCallback(
    ({item, index}: {item: any; index: number}) => {
      if (item === EMPTY) {
        return (
          <EmptyState
            icon={ListIcon}
            message={_(
              msg`Lists allow you to see content from your favorite people.`,
            )}
            testID="listsEmpty"
          />
        )
      } else if (item === ERROR_ITEM) {
        return (
          <ErrorMessage
            message={cleanError(error)}
            onPressTryAgain={onRefresh}
          />
        )
      } else if (item === LOADING) {
        return (
          <View style={{padding: 20}}>
            <ActivityIndicator />
          </View>
        )
      }
      return renderItem ? (
        renderItem(item, index)
      ) : (
        <View
          style={[
            index !== 0 && a.border_t,
            t.atoms.border_contrast_low,
            a.px_lg,
            a.py_lg,
          ]}>
          <ListCard.Default view={item} />
        </View>
      )
    },
    [_, t, renderItem, error, onRefresh],
  )

  if (inline) {
    return (
      <View testID={testID} style={style}>
        {items.length > 0 && (
          <RNFlatList
            testID={testID ? `${testID}-flatlist` : undefined}
            data={items}
            keyExtractor={item => (item.uri ? item.uri : item._reactKey)}
            renderItem={renderItemInner}
            refreshControl={
              <RefreshControl
                refreshing={isPTRing}
                onRefresh={onRefresh}
                tintColor={pal.colors.text}
                titleColor={pal.colors.text}
              />
            }
            contentContainerStyle={[s.contentContainer]}
            removeClippedSubviews={true}
          />
        )}
      </View>
    )
  } else {
    return (
      <View testID={testID} style={style}>
        {items.length > 0 && (
          <List
            testID={testID ? `${testID}-flatlist` : undefined}
            data={items}
            keyExtractor={item => (item.uri ? item.uri : item._reactKey)}
            renderItem={renderItemInner}
            refreshing={isPTRing}
            onRefresh={onRefresh}
            contentContainerStyle={[s.contentContainer]}
            removeClippedSubviews={true}
            desktopFixedHeight
            sideBorders={false}
          />
        )}
      </View>
    )
  }
}
