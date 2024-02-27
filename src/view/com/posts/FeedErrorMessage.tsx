import React from 'react'
import {View} from 'react-native'
import {AppBskyFeedGetAuthorFeed, AtUri} from '@atproto/api'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {ErrorMessage} from '../util/error/ErrorMessage'
import {usePalette} from 'lib/hooks/usePalette'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {logger} from '#/logger'
import {useModalControls} from '#/state/modals'
import {msg as msgLingui, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {FeedDescriptor} from '#/state/queries/post-feed'
import {EmptyState} from '../util/EmptyState'
import {cleanError} from '#/lib/strings/errors'
import {useRemoveFeedMutation} from '#/state/queries/preferences'

export enum KnownError {
  Block = 'Block',
  FeedgenDoesNotExist = 'FeedgenDoesNotExist',
  FeedgenMisconfigured = 'FeedgenMisconfigured',
  FeedgenBadResponse = 'FeedgenBadResponse',
  FeedgenOffline = 'FeedgenOffline',
  FeedgenUnknown = 'FeedgenUnknown',
  FeedNSFPublic = 'FeedNSFPublic',
  FeedTooManyRequests = 'FeedTooManyRequests',
  Unknown = 'Unknown',
}

export function FeedErrorMessage({
  feedDesc,
  error,
  onPressTryAgain,
}: {
  feedDesc: FeedDescriptor
  error?: Error
  onPressTryAgain: () => void
}) {
  const {_: _l} = useLingui()
  const knownError = React.useMemo(
    () => detectKnownError(feedDesc, error),
    [feedDesc, error],
  )
  if (
    typeof knownError !== 'undefined' &&
    knownError !== KnownError.Unknown &&
    feedDesc.startsWith('feedgen')
  ) {
    return (
      <FeedgenErrorMessage
        feedDesc={feedDesc}
        knownError={knownError}
        rawError={error}
      />
    )
  }

  if (knownError === KnownError.Block) {
    return (
      <EmptyState
        icon="ban"
        message={_l(msgLingui`Posts hidden`)}
        style={{paddingVertical: 40}}
      />
    )
  }

  return (
    <ErrorMessage
      message={cleanError(error)}
      onPressTryAgain={onPressTryAgain}
    />
  )
}

function FeedgenErrorMessage({
  feedDesc,
  knownError,
  rawError,
}: {
  feedDesc: FeedDescriptor
  knownError: KnownError
  rawError?: Error
}) {
  const pal = usePalette('default')
  const {_: _l} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const msg = React.useMemo(
    () =>
      ({
        [KnownError.Unknown]: '',
        [KnownError.Block]: '',
        [KnownError.FeedgenDoesNotExist]: _l(
          msgLingui`Hmm, we're having trouble finding this feed. It may have been deleted.`,
        ),
        [KnownError.FeedgenMisconfigured]: _l(
          msgLingui`Hmm, the feed server appears to be misconfigured. Please let the feed owner know about this issue.`,
        ),
        [KnownError.FeedgenBadResponse]: _l(
          msgLingui`Hmm, the feed server gave a bad response. Please let the feed owner know about this issue.`,
        ),
        [KnownError.FeedgenOffline]: _l(
          msgLingui`Hmm, the feed server appears to be offline. Please let the feed owner know about this issue.`,
        ),
        [KnownError.FeedNSFPublic]: _l(
          msgLingui`This content is not viewable without a Bluesky account.`,
        ),
        [KnownError.FeedgenUnknown]: _l(
          msgLingui`Hmm, some kind of issue occurred when contacting the feed server. Please let the feed owner know about this issue.`,
        ),
        [KnownError.FeedTooManyRequests]: _l(
          msgLingui`This feed is currently receiving high traffic and is temporarily unavailable. Please try again later.`,
        ),
      }[knownError]),
    [_l, knownError],
  )
  const [_, uri] = feedDesc.split('|')
  const [ownerDid] = safeParseFeedgenUri(uri)
  const {openModal, closeModal} = useModalControls()
  const {mutateAsync: removeFeed} = useRemoveFeedMutation()

  const onViewProfile = React.useCallback(() => {
    navigation.navigate('Profile', {name: ownerDid})
  }, [navigation, ownerDid])

  const onRemoveFeed = React.useCallback(async () => {
    openModal({
      name: 'confirm',
      title: _l(msgLingui`Remove feed`),
      message: _l(msgLingui`Remove this feed from your saved feeds?`),
      async onPressConfirm() {
        try {
          await removeFeed({uri})
        } catch (err) {
          Toast.show(
            _l(
              msgLingui`There was an an issue removing this feed. Please check your internet connection and try again.`,
            ),
          )
          logger.error('Failed to remove feed', {message: err})
        }
      },
      onPressCancel() {
        closeModal()
      },
    })
  }, [openModal, closeModal, uri, removeFeed, _l])

  const cta = React.useMemo(() => {
    switch (knownError) {
      case KnownError.FeedNSFPublic: {
        return null
      }
      case KnownError.FeedgenDoesNotExist:
      case KnownError.FeedgenMisconfigured:
      case KnownError.FeedgenBadResponse:
      case KnownError.FeedgenOffline:
      case KnownError.FeedgenUnknown: {
        return (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            {knownError === KnownError.FeedgenDoesNotExist && (
              <Button
                type="inverted"
                label={_l(msgLingui`Remove feed`)}
                onPress={onRemoveFeed}
              />
            )}
            <Button
              type="default-light"
              label={_l(msgLingui`View profile`)}
              onPress={onViewProfile}
            />
          </View>
        )
      }
    }
  }, [knownError, onViewProfile, onRemoveFeed, _l])

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

      {rawError?.message && (
        <Text style={pal.textLight}>
          <Trans>Message from server: {rawError.message}</Trans>
        </Text>
      )}

      {cta}
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
  if (
    error instanceof AppBskyFeedGetAuthorFeed.BlockedActorError ||
    error instanceof AppBskyFeedGetAuthorFeed.BlockedByActorError
  ) {
    return KnownError.Block
  }

  // check status codes
  if (error?.status === 429) {
    return KnownError.FeedTooManyRequests
  }

  // convert error to string and continue
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
  if (error.includes(KnownError.FeedNSFPublic)) {
    return KnownError.FeedNSFPublic
  }
  return KnownError.FeedgenUnknown
}
