import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {usePalette} from 'lib/hooks/usePalette'
import {HeartIcon} from 'lib/icons'
import {CommonNavigatorParams} from 'lib/routes/types'
import {colors, s} from 'lib/styles'
import {observer} from 'mobx-react-lite'
import React, {useMemo, useRef} from 'react'
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native'
import {useStores} from 'state/index'
import {PostsFeedModel} from 'state/models/feeds/posts'
import {useCustomFeed} from 'view/com/algos/useCustomFeed'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {Feed} from 'view/com/posts/Feed'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {Button} from 'view/com/util/forms/Button'
import {Text} from 'view/com/util/text/Text'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CustomFeed'>
export const CustomFeed = withAuthRequired(
  observer(({route, navigation}: Props) => {
    const rootStore = useStores()
    const {rkey, name} = route.params
    const currentFeed = useCustomFeed(rkey)
    const pal = usePalette('default')

    const scrollElRef = useRef<FlatList>(null)

    const algoFeed: PostsFeedModel = useMemo(() => {
      const feed = new PostsFeedModel(rootStore, 'custom', {
        feed: rkey,
      })
      feed.setup()
      return feed
    }, [rkey, rootStore])

    return (
      <View style={[styles.container]}>
        <View>
          <ViewHeader
            title={name ?? `${currentFeed?.data.creator.displayName}'s feed`}
            showOnDesktop
          />
          <View style={[styles.center]}>
            <View style={[styles.header]}>
              <View style={styles.avatarContainer}>
                <UserAvatar
                  size={30}
                  avatar={currentFeed?.data.creator.avatar}
                />
                <Text style={[pal.textLight]}>
                  @{currentFeed?.data.creator.handle}
                </Text>
              </View>
              <Text style={[pal.text]}>{currentFeed?.data.description}</Text>
            </View>

            <View style={[styles.buttonsContainer]}>
              <Button
                type={currentFeed?.isSaved ? 'default' : 'inverted'}
                style={[styles.saveButton]}
                onPress={() => {
                  if (currentFeed?.data.viewer?.saved) {
                    currentFeed?.unsave()
                    rootStore.me.savedFeeds.removeFeed(currentFeed!.data.uri)
                  } else {
                    currentFeed!.save()
                    rootStore.me.savedFeeds.addFeed(currentFeed!)
                  }
                }}
                label={currentFeed?.data.viewer?.saved ? 'Unsave' : 'Save'}
              />

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  currentFeed?.like()
                }}
                style={[styles.likeButton]}>
                <Text style={[pal.text, s.semiBold]}>
                  {currentFeed?.data.likeCount}
                </Text>
                <HeartIcon strokeWidth={3} size={18} style={styles.liked} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Feed
          scrollElRef={scrollElRef}
          testID={'test-feed'}
          key="default"
          feed={algoFeed}
          headerOffset={12}
        />
      </View>
    )
  }),
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  center: {alignItems: 'center', justifyContent: 'center', gap: 8},
  header: {
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    flexDirection: 'row',
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
    backgroundColor: colors.gray1,
    gap: 4,
  },
})
