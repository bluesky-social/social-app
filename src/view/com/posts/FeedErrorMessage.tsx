import React from 'react'
import {View} from 'react-native'
import {AtUri, AppBskyFeedGetFeed as GetCustomFeed} from '@atproto/api'
import {PostsFeedModel, KnownError} from 'state/models/feeds/posts'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {usePalette} from 'lib/hooks/usePalette'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {useStores} from 'state/index'
import {logger} from '#/logger'
import {useModalControls} from '#/state/modals'
import {FeedDescriptor} from '#/state/queries/post-feed'

const MESSAGES = {
  [KnownError.Unknown]: '',
  [KnownError.FeedgenDoesNotExist]: `Hmmm, we're having trouble finding this feed. It may have been deleted.`,
  [KnownError.FeedgenMisconfigured]:
    'Hmm, the feed server appears to be misconfigured. Please let the feed owner know about this issue.',
  [KnownError.FeedgenBadResponse]:
    'Hmm, the feed server gave a bad response. Please let the feed owner know about this issue.',
  [KnownError.FeedgenOffline]:
    'Hmm, the feed server appears to be offline. Please let the feed owner know about this issue.',
  [KnownError.FeedgenUnknown]:
    'Hmm, some kind of issue occured when contacting the feed server. Please let the feed owner know about this issue.',
}

export function FeedErrorMessage({
  feedDesc,
  error,
  onPressTryAgain,
}: {
  feedDesc: FeedDescriptor
  error: any
  onPressTryAgain: () => void
}) {
  const knownError = React.useMemo(
    () => detectKnownError(feedDesc, error),
    [feedDesc, error],
  )
  if (
    typeof knownError === 'undefined' ||
    knownError === KnownError.Unknown ||
    true /*TODO*/
  ) {
    return <ErrorMessage message={error} onPressTryAgain={onPressTryAgain} />
  }

  // TODO
  // return <FeedgenErrorMessage feed={feed} knownError={feed.knownError} />
}

function FeedgenErrorMessage({
  feed,
  knownError,
}: {
  feed: PostsFeedModel
  knownError: KnownError
}) {
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const msg = MESSAGES[knownError]
  const uri = (feed.params as GetCustomFeed.QueryParams).feed
  const [ownerDid] = safeParseFeedgenUri(uri)
  const {openModal, closeModal} = useModalControls()

  const onViewProfile = React.useCallback(() => {
    navigation.navigate('Profile', {name: ownerDid})
  }, [navigation, ownerDid])

  const onRemoveFeed = React.useCallback(async () => {
    openModal({
      name: 'confirm',
      title: 'Remove feed',
      message: 'Remove this feed from your saved feeds?',
      async onPressConfirm() {
        try {
          await store.preferences.removeSavedFeed(uri)
        } catch (err) {
          Toast.show(
            'There was an an issue removing this feed. Please check your internet connection and try again.',
          )
          logger.error('Failed to remove feed', {error: err})
        }
      },
      onPressCancel() {
        closeModal()
      },
    })
  }, [store, openModal, closeModal, uri])

  return (
    <View
      style={[
        pal.border,
        pal.viewLight,
        {
          borderTopWidth: 1,
          paddingHorizontal: 20,
          paddingVertical: 18,
          gap: 12,
        },
      ]}>
      <Text style={pal.text}>{msg}</Text>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
        {knownError === KnownError.FeedgenDoesNotExist && (
          <Button type="inverted" label="Remove feed" onPress={onRemoveFeed} />
        )}
        <Button
          type="default-light"
          label="View profile"
          onPress={onViewProfile}
        />
      </View>
    </View>
  )
}

function safeParseFeedgenUri(uri: string): [string, string] {
  try {
    const urip = new AtUri(uri)
    return [urip.hostname, urip.rkey]
  } catch {
    return ['', '']
  }
}

function detectKnownError(
  feedDesc: FeedDescriptor,
  error: any,
): KnownError | undefined {
  if (!error) {
    return undefined
  }
  if (typeof error !== 'string') {
    error = error.toString()
  }
  if (!feedDesc.startsWith('feedgen')) {
    return KnownError.Unknown
  }
  if (error.includes('could not find feed')) {
    return KnownError.FeedgenDoesNotExist
  }
  if (error.includes('feed unavailable')) {
    return KnownError.FeedgenOffline
  }
  if (error.includes('invalid did document')) {
    return KnownError.FeedgenMisconfigured
  }
  if (error.includes('could not resolve did document')) {
    return KnownError.FeedgenMisconfigured
  }
  if (
    error.includes('invalid feed generator service details in did document')
  ) {
    return KnownError.FeedgenMisconfigured
  }
  if (error.includes('feed provided an invalid response')) {
    return KnownError.FeedgenBadResponse
  }
  return KnownError.FeedgenUnknown
}
