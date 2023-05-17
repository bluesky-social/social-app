import React from 'react'
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  TouchableOpacity,
} from 'react-native'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {UserAvatar} from '../util/UserAvatar'
import {Button} from '../util/forms/Button'
import {observer} from 'mobx-react-lite'
import {CustomFeedModel} from 'state/models/feeds/custom-feed'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {useStores} from 'state/index'
import {pluralize} from 'lib/strings/helpers'
import {AtUri} from '@atproto/api'
import {isWeb} from 'platform/detection'

export const CustomFeed = observer(
  ({
    item,
    style,
    showLikes = false,
    reloadOnFocus = false,
  }: {
    item: CustomFeedModel
    style?: StyleProp<ViewStyle>
    showLikes?: boolean
    reloadOnFocus?: boolean
  }) => {
    const store = useStores()
    const pal = usePalette('default')
    const navigation = useNavigation<NavigationProp>()

    // TODO: this is pretty hacky, but it works for now
    // causes issues on web
    useFocusEffect(() => {
      if (reloadOnFocus && !isWeb) {
        item.reload()
      }
    })

    return (
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.container, pal.border, style]}
        onPress={() => {
          navigation.navigate('CustomFeed', {
            name: item.data.creator.did,
            rkey: new AtUri(item.data.uri).rkey,
            displayName:
              item.data.displayName ??
              `${item.data.creator.displayName}'s feed`,
          })
        }}
        key={item.data.uri}>
        <View style={[styles.headerContainer]}>
          <View style={[s.mr10]}>
            <UserAvatar type="algo" size={36} avatar={item.data.avatar} />
          </View>
          <View style={[styles.headerTextContainer]}>
            <Text style={[pal.text, s.bold]}>
              {item.data.displayName ?? 'Feed name'}
            </Text>
            <Text style={[pal.textLight]}>by @{item.data.creator.handle}</Text>
          </View>
          <View>
            <Button
              type={item.isSaved ? 'default' : 'inverted'}
              onPress={() => {
                if (item.data.viewer?.saved) {
                  store.me.savedFeeds.unsave(item)
                } else {
                  store.me.savedFeeds.save(item)
                }
              }}
              label={item.data.viewer?.saved ? 'Unsave' : 'Save'}
            />
          </View>
        </View>

        {item.data.description ? (
          <Text style={[pal.textLight, styles.description]} numberOfLines={3}>
            {item.data.description}
          </Text>
        ) : null}

        {showLikes ? (
          <View style={styles.bottomContainer}>
            <View style={styles.likedByContainer}>
              <Text type="sm-medium" style={[pal.text, pal.textLight]}>
                Liked by {item.data.likeCount || 0}{' '}
                {pluralize(item.data.likeCount || 0, 'user')}
              </Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    )
  },
)

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
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
