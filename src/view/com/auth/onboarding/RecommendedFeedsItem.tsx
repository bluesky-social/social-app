import React from 'react'
import {View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AppBskyFeedDefs, RichText as BskRichText} from '@atproto/api'
import {Text} from 'view/com/util/text/Text'
import {RichText} from 'view/com/util/text/RichText'
import {Button} from 'view/com/util/forms/Button'
import {UserAvatar} from 'view/com/util/UserAvatar'
import * as Toast from 'view/com/util/Toast'
import {HeartIcon} from 'lib/icons'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {sanitizeHandle} from 'lib/strings/handles'
import {
  usePreferencesQuery,
  usePinFeedMutation,
  useRemoveFeedMutation,
} from '#/state/queries/preferences'
import {logger} from '#/logger'
import {useAnalytics} from '#/lib/analytics/analytics'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

export function RecommendedFeedsItem({
  item,
}: {
  item: AppBskyFeedDefs.GeneratorView
}) {
  const {isMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const {
    mutateAsync: pinFeed,
    variables: pinnedFeed,
    reset: resetPinFeed,
  } = usePinFeedMutation()
  const {
    mutateAsync: removeFeed,
    variables: removedFeed,
    reset: resetRemoveFeed,
  } = useRemoveFeedMutation()
  const {track} = useAnalytics()

  if (!item || !preferences) return null

  const isPinned =
    !removedFeed?.uri &&
    (pinnedFeed?.uri || preferences.feeds.saved.includes(item.uri))

  const onToggle = async () => {
    if (isPinned) {
      try {
        await removeFeed({uri: item.uri})
        resetRemoveFeed()
      } catch (e) {
        Toast.show(_(msg`There was an issue contacting your server`))
        logger.error('Failed to unsave feed', {message: e})
      }
    } else {
      try {
        await pinFeed({uri: item.uri})
        resetPinFeed()
        track('Onboarding:CustomFeedAdded')
      } catch (e) {
        Toast.show(_(msg`There was an issue contacting your server`))
        logger.error('Failed to pin feed', {message: e})
      }
    }
  }

  return (
    <View testID={`feed-${item.displayName}`}>
      <View
        style={[
          pal.border,
          {
            flex: isMobile ? 1 : undefined,
            flexDirection: 'row',
            gap: 18,
            maxWidth: isMobile ? undefined : 670,
            borderRightWidth: isMobile ? undefined : 1,
            paddingHorizontal: 24,
            paddingVertical: isMobile ? 12 : 24,
            borderTopWidth: 1,
          },
        ]}>
        <View style={{marginTop: 2}}>
          <UserAvatar type="algo" size={42} avatar={item.avatar} />
        </View>
        <View style={{flex: isMobile ? 1 : undefined}}>
          <Text
            type="2xl-bold"
            numberOfLines={1}
            style={[pal.text, {fontSize: 19}]}>
            {item.displayName}
          </Text>

          <Text style={[pal.textLight, {marginBottom: 8}]} numberOfLines={1}>
            <Trans>by {sanitizeHandle(item.creator.handle, '@')}</Trans>
          </Text>

          {item.description ? (
            <RichText
              type="xl"
              style={[
                pal.text,
                {
                  flex: isMobile ? 1 : undefined,
                  maxWidth: 550,
                  marginBottom: 18,
                },
              ]}
              richText={new BskRichText({text: item.description || ''})}
              numberOfLines={6}
            />
          ) : null}

          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <Button
              type="inverted"
              style={{paddingVertical: 6}}
              onPress={onToggle}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingRight: 2,
                  gap: 6,
                }}>
                {isPinned ? (
                  <>
                    <FontAwesomeIcon
                      icon="check"
                      size={16}
                      color={pal.colors.textInverted}
                    />
                    <Text type="lg-medium" style={pal.textInverted}>
                      <Trans>Added</Trans>
                    </Text>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon="plus"
                      size={16}
                      color={pal.colors.textInverted}
                    />
                    <Text type="lg-medium" style={pal.textInverted}>
                      <Trans>Add</Trans>
                    </Text>
                  </>
                )}
              </View>
            </Button>

            <View style={{flexDirection: 'row', gap: 4}}>
              <HeartIcon
                size={16}
                strokeWidth={2.5}
                style={[pal.textLight, {position: 'relative', top: 2}]}
              />
              <Text type="lg-medium" style={[pal.text, pal.textLight]}>
                {item.likeCount || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
