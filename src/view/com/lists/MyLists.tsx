import React from 'react'
import {
  ActivityIndicator,
  FlatList as RNFlatList,
  RefreshControl,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {Trans} from '@lingui/macro'

import {usePalette} from '#/lib/hooks/usePalette'
import {cleanError} from '#/lib/strings/errors'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {MyListsFilter, useMyListsQuery} from '#/state/queries/my-lists'
import {atoms as a, useTheme} from '#/alf'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import * as ListCard from '#/components/ListCard'
import {Text} from '#/components/Typography'
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
  const moderationOpts = useModerationOpts()
  const [isPTRing, setIsPTRing] = React.useState(false)
  const {data, isFetching, isFetched, isError, error, refetch} =
    useMyListsQuery(filter)
  const isEmpty = !isFetching && !data?.length

  const items = React.useMemo(() => {
    let items: any[] = []
    if (isError && isEmpty) {
      items = items.concat([ERROR_ITEM])
    }
    if ((!isFetched && isFetching) || !moderationOpts) {
      items = items.concat([LOADING])
    } else if (isEmpty) {
      items = items.concat([EMPTY])
    } else {
      items = items.concat(data)
    }
    return items
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
          <View style={[a.flex_1, a.align_center, a.gap_sm, a.px_xl, a.pt_xl]}>
            <View
              style={[
                a.align_center,
                a.justify_center,
                a.rounded_full,
                t.atoms.bg_contrast_25,
                {
                  width: 32,
                  height: 32,
                },
              ]}>
              <ListIcon size="md" fill={t.atoms.text_contrast_low.color} />
            </View>
            <Text
              style={[
                a.text_center,
                a.flex_1,
                a.text_sm,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                {
                  maxWidth: 200,
                },
              ]}>
              {filter === 'curate' && (
                <Trans>
                  Public, sharable lists which can be used to drive feeds.
                </Trans>
              )}
              {filter === 'mod' && (
                <Trans>
                  Public, sharable lists of users to mute or block in bulk.
                </Trans>
              )}
            </Text>
          </View>
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
    [t, renderItem, error, onRefresh, filter],
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
