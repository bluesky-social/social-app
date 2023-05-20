import React, {useMemo, useRef} from 'react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {colors, s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import {FlatList, StyleSheet, View} from 'react-native'
import {useStores} from 'state/index'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useCustomFeed} from 'lib/hooks/useCustomFeed'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from 'view/com/posts/Feed'
import {pluralize} from 'lib/strings/helpers'
import {TextLink} from 'view/com/util/Link'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'
import * as Toast from 'view/com/util/Toast'
import {isDesktopWeb} from 'platform/detection'
import {useSetTitle} from 'lib/hooks/useSetTitle'
import {shareUrl} from 'lib/sharing'
import {toShareUrl} from 'lib/strings/url-helpers'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomFeed'>
export const CustomFeedScreen = withAuthRequired(
  observer(({route}: Props) => {
    const store = useStores()
    const pal = usePalette('default')
    const {rkey, name} = route.params
    const uri = useMemo(
      () => makeRecordUri(name, 'app.bsky.feed.generator', rkey),
      [rkey, name],
    )
    const scrollElRef = useRef<FlatList>(null)
    const currentFeed = useCustomFeed(uri)
    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(store, 'custom', {
        feed: uri,
      })
      feed.setup()
      return feed
    }, [store, uri])

    useSetTitle(currentFeed?.displayName)

    const onToggleSaved = React.useCallback(async () => {
      try {
        if (currentFeed?.isSaved) {
          await currentFeed?.unsave()
        } else {
          await currentFeed?.save()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue updating your feeds, please check your internet connection and try again.',
        )
        store.log.error('Failed up update feeds', {err})
      }
    }, [store, currentFeed])

    const onToggleLiked = React.useCallback(async () => {
      try {
        if (currentFeed?.isLiked) {
          await currentFeed?.unlike()
        } else {
          await currentFeed?.like()
        }
      } catch (err) {
        Toast.show(
          'There was an an issue contacting the server, please check your internet connection and try again.',
        )
        store.log.error('Failed up toggle like', {err})
      }
    }, [store, currentFeed])
    const onPressShare = React.useCallback(() => {
      const url = toShareUrl(`/profile/${name}/feed/${rkey}`)
      shareUrl(url)
    }, [name, rkey])

    const renderHeaderBtns = React.useCallback(() => {
      return (
        <View style={styles.headerBtns}>
          <Button
            testID="shareBtn"
            type="default"
            accessibilityLabel="Share this feed"
            accessibilityHint=""
            onPress={onPressShare}>
            <FontAwesomeIcon icon="share" size={18} color={pal.colors.icon} />
          </Button>
          <Button
            type="default"
            testID="toggleLikeBtn"
            accessibilityLabel="Like this feed"
            accessibilityHint=""
            onPress={onToggleLiked}>
            {currentFeed?.isLiked ? (
              <HeartIconSolid size={18} style={styles.liked} />
            ) : (
              <HeartIcon strokeWidth={3} size={18} style={pal.textLight} />
            )}
          </Button>
          <Button
            type={currentFeed?.isSaved ? 'default' : 'inverted'}
            onPress={onToggleSaved}
            accessibilityLabel={
              currentFeed?.isSaved ? 'Remove from my feeds' : 'Add to my feeds'
            }
            accessibilityHint=""
            label={
              currentFeed?.isSaved ? 'Remove from My Feeds' : 'Add to My Feeds'
            }
          />
        </View>
      )
    }, [
      pal,
      currentFeed?.isSaved,
      currentFeed?.isLiked,
      onToggleSaved,
      onToggleLiked,
      onPressShare,
    ])

    const renderListHeaderComponent = React.useCallback(() => {
      return (
        <>
          <View style={[styles.header, pal.border]}>
            <View style={s.flex1}>
              <Text
                testID="feedName"
                type="title-xl"
                style={[pal.text, s.bold]}>
                {currentFeed?.displayName}
              </Text>
              {currentFeed && (
                <Text type="md" style={[pal.textLight]} numberOfLines={1}>
                  by{' '}
                  {currentFeed.data.creator.did === store.me.did ? (
                    'you'
                  ) : (
                    <TextLink
                      text={`@${currentFeed.data.creator.handle}`}
                      href={`/profile/${currentFeed.data.creator.did}`}
                      style={[pal.textLight]}
                    />
                  )}
                </Text>
              )}
              {isDesktopWeb && (
                <View style={styles.headerBtns}>
                  <Button
                    type={currentFeed?.isSaved ? 'default' : 'inverted'}
                    onPress={onToggleSaved}
                    accessibilityLabel={
                      currentFeed?.isSaved
                        ? 'Unsave this feed'
                        : 'Save this feed'
                    }
                    accessibilityHint=""
                    label={
                      currentFeed?.isSaved
                        ? 'Remove from My Feeds'
                        : 'Add to My Feeds'
                    }
                  />
                  <Button
                    type="default"
                    accessibilityLabel="Like this feed"
                    accessibilityHint=""
                    onPress={onToggleLiked}>
                    {currentFeed?.isLiked ? (
                      <HeartIconSolid size={18} style={styles.liked} />
                    ) : (
                      <HeartIcon strokeWidth={3} size={18} style={pal.icon} />
                    )}
                  </Button>
                  <Button
                    type="default"
                    accessibilityLabel="Share this feed"
                    accessibilityHint=""
                    onPress={onPressShare}>
                    <FontAwesomeIcon
                      icon="share"
                      size={18}
                      color={pal.colors.icon}
                    />
                  </Button>
                </View>
              )}
            </View>
            <View>
              <UserAvatar
                type="algo"
                avatar={currentFeed?.data.avatar}
                size={64}
              />
            </View>
          </View>
          <View style={styles.headerDetails}>
            {currentFeed?.data.description ? (
              <Text style={[pal.text, s.mb10]} numberOfLines={6}>
                {currentFeed.data.description}
              </Text>
            ) : null}
            <TextLink
              type="md-medium"
              style={pal.textLight}
              href={`/profile/${name}/feed/${rkey}/liked-by`}
              text={`Liked by ${currentFeed?.data.likeCount} ${pluralize(
                currentFeed?.data.likeCount || 0,
                'user',
              )}`}
            />
          </View>
          <View style={[styles.fakeSelector, pal.border]}>
            <View
              style={[styles.fakeSelectorItem, {borderColor: pal.colors.link}]}>
              <Text type="md-medium" style={[pal.text]}>
                Feed
              </Text>
            </View>
          </View>
        </>
      )
    }, [
      store.me.did,
      pal,
      currentFeed,
      onToggleLiked,
      onToggleSaved,
      onPressShare,
      name,
      rkey,
    ])

    return (
      <View style={s.hContentRegion}>
        <ViewHeader title="" renderButton={renderHeaderBtns} />
        <Feed
          scrollElRef={scrollElRef}
          feed={algoFeed}
          ListHeaderComponent={renderListHeaderComponent}
          extraData={uri}
        />
      </View>
    )
  }),
)

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  headerDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fakeSelector: {
    flexDirection: 'row',
    paddingHorizontal: isDesktopWeb ? 16 : 6,
  },
  fakeSelectorItem: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 3,
  },
  liked: {
    color: colors.red3,
  },
})
