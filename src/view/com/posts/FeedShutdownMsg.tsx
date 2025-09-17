import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {PROD_DEFAULT_FEED} from '#/lib/constants'
import {logger} from '#/logger'
import {
  usePreferencesQuery,
  useRemoveFeedMutation,
  useReplaceForYouWithDiscoverFeedMutation,
} from '#/state/queries/preferences'
import {useSetSelectedFeed} from '#/state/shell/selected-feed'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {InlineLinkText} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function FeedShutdownMsg({feedUri}: {feedUri: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const setSelectedFeed = useSetSelectedFeed()
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: removeFeed, isPending: isRemovePending} =
    useRemoveFeedMutation()
  const {mutateAsync: replaceFeedWithDiscover, isPending: isReplacePending} =
    useReplaceForYouWithDiscoverFeedMutation()

  const feedConfig = preferences?.savedFeeds?.find(
    f => f.value === feedUri && f.pinned,
  )
  const discoverFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === PROD_DEFAULT_FEED('whats-hot'),
  )
  const hasFeedPinned = Boolean(feedConfig)
  const hasDiscoverPinned = Boolean(discoverFeedConfig?.pinned)

  const onRemoveFeed = React.useCallback(async () => {
    try {
      if (feedConfig) {
        await removeFeed(feedConfig)
        Toast.show(_(msg`Removed from your feeds`))
      }
      if (hasDiscoverPinned) {
        setSelectedFeed(`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`)
      }
    } catch (err: any) {
      Toast.show(
        _(
          msg`There was an issue updating your feeds, please check your internet connection and try again.`,
        ),
        'exclamation-circle',
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }, [removeFeed, feedConfig, _, hasDiscoverPinned, setSelectedFeed])

  const onReplaceFeed = React.useCallback(async () => {
    try {
      await replaceFeedWithDiscover({
        forYouFeedConfig: feedConfig,
        discoverFeedConfig,
      })
      setSelectedFeed(`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`)
      Toast.show(_(msg`The feed has been replaced with Discover.`))
    } catch (err: any) {
      Toast.show(
        _(
          msg`There was an issue updating your feeds, please check your internet connection and try again.`,
        ),
        'exclamation-circle',
      )
      logger.error('Failed to update feeds', {message: err})
    }
  }, [
    replaceFeedWithDiscover,
    discoverFeedConfig,
    feedConfig,
    setSelectedFeed,
    _,
  ])

  const isProcessing = isReplacePending || isRemovePending
  return (
    <View
      style={[
        a.py_3xl,
        a.px_2xl,
        a.gap_xl,
        t.atoms.border_contrast_low,
        a.border_t,
      ]}>
      <Text style={[a.text_5xl, a.font_semi_bold, t.atoms.text, a.text_center]}>
        :(
      </Text>
      <Text style={[a.text_md, a.leading_snug, t.atoms.text, a.text_center]}>
        <Trans>
          This feed is no longer online. We are showing{' '}
          <InlineLinkText
            label={_(msg`The Discover feed`)}
            to="/profile/bsky.app/feed/whats-hot"
            style={[a.text_md]}>
            Discover
          </InlineLinkText>{' '}
          instead.
        </Trans>
      </Text>
      {hasFeedPinned ? (
        <View style={[a.flex_row, a.justify_center, a.gap_sm]}>
          <Button
            variant="outline"
            color="primary"
            size="small"
            label={_(msg`Remove feed`)}
            disabled={isProcessing}
            onPress={onRemoveFeed}>
            <ButtonText>
              <Trans>Remove feed</Trans>
            </ButtonText>
            {isRemovePending && <ButtonIcon icon={Loader} />}
          </Button>
          {!hasDiscoverPinned && (
            <Button
              variant="solid"
              color="primary"
              size="small"
              label={_(msg`Replace with Discover`)}
              disabled={isProcessing}
              onPress={onReplaceFeed}>
              <ButtonText>
                <Trans>Replace with Discover</Trans>
              </ButtonText>
              {isReplacePending && <ButtonIcon icon={Loader} />}
            </Button>
          )}
        </View>
      ) : undefined}
    </View>
  )
}
