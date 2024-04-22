import React, {useCallback} from 'react'
import {View} from 'react-native'
import {AtUri} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {cleanError} from '#/lib/strings/errors'
import {useFeedSourceInfoQuery} from '#/state/queries/feed'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {NavigationProp} from 'lib/routes/types'
import {LoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {router} from '#/routes'
import {Button} from '../Button'
import {Text} from '../Typography'

export function MyFeedsDialog({control}: {control: Dialog.DialogControlProps}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: preferences} = usePreferencesQuery()
  const navigation = useNavigation<NavigationProp>()

  const onPressFeed = useCallback(
    (uri: string) => {
      control.close()

      const urip = new AtUri(uri)
      const collection =
        urip.collection === 'app.bsky.feed.generator' ? 'feed' : 'lists'
      const href = `/profile/${urip.hostname}/${collection}/${urip.rkey}`
      const route = router.matchPath(href)
      // @ts-ignore This is correct -prf
      navigation.navigate(route[0], route[1])
    },
    [control, navigation],
  )
  const onPressEditFeeds = useCallback(() => {
    control.close()
    navigation.navigate('SavedFeeds')
  }, [control, navigation])

  let feeds: string[] = []
  if (preferences && preferences?.feeds?.saved.length !== 0) {
    const {saved, pinned} = preferences.feeds
    feeds = feeds.concat(pinned)
    feeds = feeds.concat(saved.filter(uri => !pinned.includes(uri)))
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />

      <Dialog.ScrollableInner label={_(msg`Switch Account`)}>
        {feeds.map(feedUri => (
          <SavedFeed key={feedUri} feedUri={feedUri} onPress={onPressFeed} />
        ))}
        <Button label="Edit feeds" onPress={onPressEditFeeds}>
          {() => (
            <View
              style={[
                a.border_b,
                t.atoms.border_contrast_low,
                a.px_md,
                a.py_md,
                a.flex_1,
              ]}>
              <Text numberOfLines={1} style={[t.atoms.text, a.text_md]}>
                Edit my feeds
              </Text>
            </View>
          )}
        </Button>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function SavedFeed({
  feedUri,
  onPress,
}: {
  feedUri: string
  onPress: (uri: string) => void
}) {
  const t = useTheme()
  const {data: info, error} = useFeedSourceInfoQuery({uri: feedUri})

  if (!info && !error) {
    return <SavedFeedLoadingPlaceholder />
  }

  return (
    <Button
      testID={`saved-feed-${info?.displayName}`}
      label={info ? info.displayName : 'Feed offline'}
      onPress={() => onPress(feedUri)}>
      {() => (
        <View
          style={[
            a.border_b,
            t.atoms.border_contrast_low,
            a.px_md,
            a.py_md,
            a.flex_1,
          ]}>
          <Text numberOfLines={1} style={[t.atoms.text, a.text_md]}>
            {info ? info.displayName : cleanError(error)}
          </Text>
        </View>
      )}
    </Button>
  )
}

function SavedFeedLoadingPlaceholder() {
  const t = useTheme()
  return (
    <View
      style={[
        a.flex_1,
        a.border_b,
        t.atoms.border_contrast_low,
        a.px_md,
        a.py_sm,
      ]}>
      <LoadingPlaceholder width={140} height={12} />
    </View>
  )
}
