import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon, HeartIconSolid} from 'lib/icons'
import {CommonNavigatorParams} from 'lib/routes/types'
import {makeRecordUri} from 'lib/strings/url-helpers'
import {colors, s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import React, {useMemo, useRef} from 'react'
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native'
import {useStores} from 'state/index'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useCustomFeed} from 'view/com/algos/useCustomFeed'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from 'view/com/posts/Feed'
import {Link} from 'view/com/util/Link'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomFeed'>
export const CustomFeed = withAuthRequired(
  observer(({route}: Props) => {
    const rootStore = useStores()
    const {rkey, name, displayName} = route.params
    const uri = useMemo(
      () => makeRecordUri(name, 'app.bsky.feed.generator', rkey),
      [rkey, name],
    )
    const currentFeed = useCustomFeed(uri)
    const pal = usePalette('default')
    const scrollElRef = useRef<FlatList>(null)
    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(rootStore, 'custom', {
        feed: uri,
      })
      feed.setup()
      return feed
    }, [rootStore, uri])

    const _ListHeaderComponent = () => {
      return (
        <View style={[styles.headerContainer]}>
          <View style={[styles.header]}>
            <View style={styles.avatarContainer}>
              <UserAvatar size={28} avatar={currentFeed?.data.creator.avatar} />
              <Link href={`/profile/${currentFeed?.data.creator.handle}`}>
                <Text style={[pal.textLight]}>
                  @{currentFeed?.data.creator.handle}
                </Text>
              </Link>
            </View>
            <Text style={[pal.text]}>{currentFeed?.data.description}</Text>
          </View>

          <View style={[styles.buttonsContainer]}>
            <Button
              type={currentFeed?.isSaved ? 'default' : 'inverted'}
              style={[styles.saveButton]}
              onPress={() => {
                if (currentFeed?.data.viewer?.saved) {
                  rootStore.me.savedFeeds.unsave(currentFeed!)
                } else {
                  rootStore.me.savedFeeds.save(currentFeed!)
                }
              }}
              label={currentFeed?.data.viewer?.saved ? 'Unsave' : 'Save'}
            />

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                if (currentFeed?.isLiked) {
                  currentFeed?.unlike()
                } else {
                  currentFeed?.like()
                }
              }}
              style={[styles.likeButton, pal.viewLight]}>
              <Text style={[pal.text, s.semiBold]}>
                {currentFeed?.data.likeCount}
              </Text>
              {currentFeed?.isLiked ? (
                <HeartIconSolid size={18} style={styles.liked} />
              ) : (
                <HeartIcon strokeWidth={3} size={18} style={styles.liked} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return (
      <View style={[styles.container]}>
        <ViewHeader
          title={
            displayName ?? `${currentFeed?.data.creator.displayName}'s feed`
          }
          showOnDesktop
        />

        <Feed
          scrollElRef={scrollElRef}
          testID={'test-feed'}
          key="default"
          feed={algoFeed}
          headerOffset={12}
          ListHeaderComponent={_ListHeaderComponent}
        />
      </View>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    minWidth: 100,
    alignItems: 'center',
  },
  liked: {
    color: colors.red3,
  },
  notLiked: {
    color: colors.gray3,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 24,
    gap: 4,
  },
})
