import {useCallback, useMemo, useState} from 'react'
import {
  ActivityIndicator,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native'
import {type AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {type MyListsFilter, useMyListsQuery} from '#/state/queries/my-lists'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import {List} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import * as ListCard from '#/components/ListCard'
import {ListFooter} from '#/components/Lists'
import {Text} from '#/components/Typography'

const LOADING = {_reactKey: '__loading__'}
const EMPTY = {_reactKey: '__empty__'}
const ERROR_ITEM = {_reactKey: '__error__'}

export function MyLists({
  filter,
  style,
  renderItem,
  testID,
}: {
  filter: MyListsFilter
  style?: StyleProp<ViewStyle>
  renderItem?: (list: GraphDefs.ListView, index: number) => JSX.Element
  testID?: string
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const [isPTRing, setIsPTRing] = useState(false)
  const {data, isFetching, isFetched, isError, error, refetch} =
    useMyListsQuery(filter)
  const isEmpty = !isFetching && !data?.length

  const items = useMemo(() => {
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

  let emptyText
  switch (filter) {
    case 'curate':
      emptyText = _(
        msg`Public, sharable lists which can be used to drive feeds.`,
      )
      break
    case 'mod':
      emptyText = _(
        msg`Public, sharable lists of users to mute or block in bulk.`,
      )
      break
    default:
      emptyText = _(msg`You have no lists.`)
      break
  }

  // events
  // =

  const onRefresh = useCallback(async () => {
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

  const renderItemInner = useCallback(
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
              {emptyText}
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
    [t, renderItem, error, onRefresh, emptyText],
  )

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
          removeClippedSubviews={true}
          desktopFixedHeight
          sideBorders={false}
          ListFooterComponent={
            <ListFooter error={cleanError(error)} onRetry={refetch} />
          }
        />
      )}
    </View>
  )
}
