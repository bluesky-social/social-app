import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {FeedSourceInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {
  usePinFeedMutation,
  usePreferencesQuery,
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
  useSaveFeedMutation,
} from '#/state/queries/preferences'
import {useNavigationDeduped} from 'lib/hooks/useNavigationDeduped'
import {usePalette} from 'lib/hooks/usePalette'
import {sanitizeHandle} from 'lib/strings/handles'
import {pluralize} from 'lib/strings/helpers'
import {s} from 'lib/styles'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import * as Toast from 'view/com/util/Toast'
import {useTheme} from '#/alf'
import * as Prompt from '#/components/Prompt'
import {RichText} from '#/components/RichText'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'

export function FeedSourceCard({
  feedUri,
  style,
  showSaveBtn = false,
  showDescription = false,
  showLikes = false,
  pinOnSave = false,
  showMinimalPlaceholder,
}: {
  feedUri: string
  style?: StyleProp<ViewStyle>
  showSaveBtn?: boolean
  showDescription?: boolean
  showLikes?: boolean
  pinOnSave?: boolean
  showMinimalPlaceholder?: boolean
}) {
  const {data: preferences} = usePreferencesQuery()
  const {data: feed} = useFeedSourceInfoQuery({uri: feedUri})

  return (
    <FeedSourceCardLoaded
      feedUri={feedUri}
      feed={feed}
      preferences={preferences}
      style={style}
      showSaveBtn={showSaveBtn}
      showDescription={showDescription}
      showLikes={showLikes}
      pinOnSave={pinOnSave}
      showMinimalPlaceholder={showMinimalPlaceholder}
    />
  )
}

export function FeedSourceCardLoaded({
  feedUri,
  feed,
  preferences,
  style,
  showSaveBtn = false,
  showDescription = false,
  showLikes = false,
  pinOnSave = false,
  showMinimalPlaceholder,
}: {
  feedUri: string
  feed?: FeedSourceInfo
  preferences?: UsePreferencesQueryResponse
  style?: StyleProp<ViewStyle>
  showSaveBtn?: boolean
  showDescription?: boolean
  showLikes?: boolean
  pinOnSave?: boolean
  showMinimalPlaceholder?: boolean
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const removePromptControl = Prompt.usePromptControl()
  const navigation = useNavigationDeduped()

  const {isPending: isSavePending, mutateAsync: saveFeed} =
    useSaveFeedMutation()
  const {isPending: isRemovePending, mutateAsync: removeFeed} =
    useRemoveFeedMutation()
  const {isPending: isPinPending, mutateAsync: pinFeed} = usePinFeedMutation()

  const isSaved = Boolean(preferences?.feeds?.saved?.includes(feed?.uri || ''))

  const onSave = React.useCallback(async () => {
    if (!feed) return

    try {
      if (pinOnSave) {
        await pinFeed({uri: feed.uri})
      } else {
        await saveFeed({uri: feed.uri})
      }
      Toast.show(_(msg`Added to my feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting your server`))
      logger.error('Failed to save feed', {message: e})
    }
  }, [_, feed, pinFeed, pinOnSave, saveFeed])

  const onUnsave = React.useCallback(async () => {
    if (!feed) return

    try {
      await removeFeed({uri: feed.uri})
      // await item.unsave()
      Toast.show(_(msg`Removed from my feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting your server`))
      logger.error('Failed to unsave feed', {message: e})
    }
  }, [_, feed, removeFeed])

  const onToggleSaved = React.useCallback(async () => {
    // Only feeds can be un/saved, lists are handled elsewhere
    if (feed?.type !== 'feed') return

    if (isSaved) {
      removePromptControl.open()
    } else {
      await onSave()
    }
  }, [feed?.type, isSaved, removePromptControl, onSave])

  /*
   * LOAD STATE
   *
   * This state also captures the scenario where a feed can't load for whatever
   * reason.
   */
  if (!feed || !preferences)
    return (
      <View
        style={[
          pal.border,
          {
            borderTopWidth: showMinimalPlaceholder ? 0 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            paddingRight: 18,
          },
        ]}>
        {showMinimalPlaceholder ? (
          <FeedLoadingPlaceholder
            style={{flex: 1}}
            showTopBorder={false}
            showLowerPlaceholder={false}
          />
        ) : (
          <FeedLoadingPlaceholder style={{flex: 1}} showTopBorder={false} />
        )}

        {showSaveBtn && (
          <Pressable
            testID={`feed-${feedUri}-toggleSave`}
            disabled={isRemovePending}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Remove from my feeds`)}
            accessibilityHint=""
            onPress={onToggleSaved}
            hitSlop={15}
            style={styles.btn}>
            <FontAwesomeIcon
              icon={['far', 'trash-can']}
              size={19}
              color={pal.colors.icon}
            />
          </Pressable>
        )}
      </View>
    )

  return (
    <>
      <Pressable
        testID={`feed-${feed.displayName}`}
        accessibilityRole="button"
        style={[styles.container, pal.border, style]}
        onPress={() => {
          if (feed.type === 'feed') {
            navigation.push('ProfileFeed', {
              name: feed.creatorDid,
              rkey: new AtUri(feed.uri).rkey,
            })
          } else if (feed.type === 'list') {
            navigation.push('ProfileList', {
              name: feed.creatorDid,
              rkey: new AtUri(feed.uri).rkey,
            })
          }
        }}
        key={feed.uri}>
        <View style={[styles.headerContainer]}>
          <View style={[s.mr10]}>
            <UserAvatar type="algo" size={36} avatar={feed.avatar} />
          </View>
          <View style={[styles.headerTextContainer]}>
            <Text style={[pal.text, s.bold]} numberOfLines={3}>
              {feed.displayName}
            </Text>
            <Text style={[pal.textLight]} numberOfLines={3}>
              {feed.type === 'feed' ? (
                <Trans>Feed by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
              ) : (
                <Trans>List by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
              )}
            </Text>
          </View>

          {showSaveBtn && feed.type === 'feed' && (
            <View style={[s.justifyCenter]}>
              <Pressable
                testID={`feed-${feed.displayName}-toggleSave`}
                disabled={isSavePending || isPinPending || isRemovePending}
                accessibilityRole="button"
                accessibilityLabel={
                  isSaved
                    ? _(msg`Remove from my feeds`)
                    : _(msg`Add to my feeds`)
                }
                accessibilityHint=""
                onPress={onToggleSaved}
                hitSlop={15}
                style={styles.btn}>
                {isSaved ? (
                  <FontAwesomeIcon
                    icon={['far', 'trash-can']}
                    size={19}
                    color={pal.colors.icon}
                  />
                ) : (
                  <FontAwesomeIcon
                    icon="plus"
                    size={18}
                    color={pal.colors.link}
                  />
                )}
              </Pressable>
            </View>
          )}
        </View>

        {showDescription && feed.description ? (
          <RichText
            style={[t.atoms.text_contrast_high, styles.description]}
            value={feed.description}
            numberOfLines={3}
          />
        ) : null}

        {showLikes && feed.type === 'feed' ? (
          <Text type="sm-medium" style={[pal.text, pal.textLight]}>
            <Trans>
              Liked by {feed.likeCount || 0}{' '}
              {pluralize(feed.likeCount || 0, 'user')}
            </Trans>
          </Text>
        ) : null}
      </Pressable>

      <Prompt.Basic
        control={removePromptControl}
        title={_(msg`Remove from my feeds?`)}
        description={_(
          msg`Are you sure you want to remove ${feed.displayName} from your feeds?`,
        )}
        onConfirm={onUnsave}
        confirmButtonCta={_(msg`Remove`)}
        confirmButtonColor="negative"
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: 'column',
    flex: 1,
    borderTopWidth: 1,
    gap: 14,
  },
  headerContainer: {
    flexDirection: 'row',
  },
  headerTextContainer: {
    flexDirection: 'column',
    columnGap: 4,
    flex: 1,
  },
  description: {
    flex: 1,
    flexWrap: 'wrap',
  },
  btn: {
    paddingVertical: 6,
  },
})
