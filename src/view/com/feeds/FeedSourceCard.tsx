import React from 'react'
import {
  Linking,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import {AtUri} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNavigationDeduped} from '#/lib/hooks/useNavigationDeduped'
import {usePalette} from '#/lib/hooks/usePalette'
import {sanitizeHandle} from '#/lib/strings/handles'
import {s} from '#/lib/styles'
import {logger} from '#/logger'
import {FeedSourceInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {
  useAddSavedFeedsMutation,
  usePreferencesQuery,
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
} from '#/state/queries/preferences'
import {FeedLoadingPlaceholder} from '#/view/com/util/LoadingPlaceholder'
import * as Toast from '#/view/com/util/Toast'
import {useTheme} from '#/alf'
import {atoms as a} from '#/alf'
import {shouldClickOpenNewTab} from '#/components/Link'
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
  hideTopBorder,
}: {
  feedUri: string
  style?: StyleProp<ViewStyle>
  showSaveBtn?: boolean
  showDescription?: boolean
  showLikes?: boolean
  pinOnSave?: boolean
  showMinimalPlaceholder?: boolean
  hideTopBorder?: boolean
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
      hideTopBorder={hideTopBorder}
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
  hideTopBorder,
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
  hideTopBorder?: boolean
}) {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const removePromptControl = Prompt.usePromptControl()
  const navigation = useNavigationDeduped()

  const {isPending: isAddSavedFeedPending, mutateAsync: addSavedFeeds} =
    useAddSavedFeedsMutation()
  const {isPending: isRemovePending, mutateAsync: removeFeed} =
    useRemoveFeedMutation()

  const savedFeedConfig = preferences?.savedFeeds?.find(
    f => f.value === feedUri,
  )
  const isSaved = Boolean(savedFeedConfig)

  const onSave = React.useCallback(async () => {
    if (!feed || isSaved) return

    try {
      await addSavedFeeds([
        {
          type: 'feed',
          value: feed.uri,
          pinned: pinOnSave,
        },
      ])
      Toast.show(_(msg`Added to my feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting your server`), 'xmark')
      logger.error('Failed to save feed', {message: e})
    }
  }, [_, feed, pinOnSave, addSavedFeeds, isSaved])

  const onUnsave = React.useCallback(async () => {
    if (!savedFeedConfig) return

    try {
      await removeFeed(savedFeedConfig)
      // await item.unsave()
      Toast.show(_(msg`Removed from my feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting your server`), 'xmark')
      logger.error('Failed to unsave feed', {message: e})
    }
  }, [_, removeFeed, savedFeedConfig])

  const onToggleSaved = React.useCallback(async () => {
    if (isSaved) {
      removePromptControl.open()
    } else {
      await onSave()
    }
  }, [isSaved, removePromptControl, onSave])

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
            borderTopWidth:
              showMinimalPlaceholder || hideTopBorder
                ? 0
                : StyleSheet.hairlineWidth,
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
            onPress={onUnsave}
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
        style={[
          styles.container,
          pal.border,
          style,
          {borderTopWidth: hideTopBorder ? 0 : StyleSheet.hairlineWidth},
        ]}
        onPress={e => {
          const shouldOpenInNewTab = shouldClickOpenNewTab(e)
          if (feed.type === 'feed') {
            if (shouldOpenInNewTab) {
              Linking.openURL(
                `/profile/${feed.creatorDid}/feed/${new AtUri(feed.uri).rkey}`,
              )
            } else {
              navigation.push('ProfileFeed', {
                name: feed.creatorDid,
                rkey: new AtUri(feed.uri).rkey,
              })
            }
          } else if (feed.type === 'list') {
            if (shouldOpenInNewTab) {
              Linking.openURL(
                `/profile/${feed.creatorDid}/lists/${new AtUri(feed.uri).rkey}`,
              )
            } else {
              navigation.push('ProfileList', {
                name: feed.creatorDid,
                rkey: new AtUri(feed.uri).rkey,
              })
            }
          }
        }}
        key={feed.uri}>
        <View style={[styles.headerContainer, a.align_center]}>
          <View style={[s.mr10]}>
            <UserAvatar type="algo" size={36} avatar={feed.avatar} />
          </View>
          <View style={[styles.headerTextContainer]}>
            <Text emoji style={[pal.text, s.bold]} numberOfLines={1}>
              {feed.displayName}
            </Text>
            <Text style={[pal.textLight]} numberOfLines={1}>
              {feed.type === 'feed' ? (
                <Trans>Feed by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
              ) : (
                <Trans>List by {sanitizeHandle(feed.creatorHandle, '@')}</Trans>
              )}
            </Text>
          </View>

          {showSaveBtn && (
            <View style={{alignSelf: 'center'}}>
              <Pressable
                testID={`feed-${feed.displayName}-toggleSave`}
                disabled={isAddSavedFeedPending || isRemovePending}
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
              Liked by{' '}
              <Plural
                value={feed.likeCount || 0}
                one="# user"
                other="# users"
              />
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
    gap: 14,
  },
  border: {
    borderTopWidth: StyleSheet.hairlineWidth,
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
