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
import {colors, s} from 'lib/styles'
import {UserAvatar} from '../util/UserAvatar'
import {Button} from '../util/forms/Button'
import {observer} from 'mobx-react-lite'
import {AlgoItemModel} from 'state/models/feeds/algo/algo-item'
import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {useStores} from 'state/index'
import {HeartIconSolid} from 'lib/icons'
import {pluralize} from 'lib/strings/helpers'
import {AtUri} from '@atproto/api'

const AlgoItem = observer(
  ({
    item,
    style,
    showBottom = true,
    reloadOnFocus = false,
  }: {
    item: AlgoItemModel
    style?: StyleProp<ViewStyle>
    showBottom?: boolean
    reloadOnFocus?: boolean
  }) => {
    const store = useStores()
    const pal = usePalette('default')
    const navigation = useNavigation<NavigationProp>()

    // TODO: this is pretty hacky, but it works for now
    useFocusEffect(() => {
      if (reloadOnFocus) {
        item.reload()
      }
    })

    return (
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.container, style]}
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
            <UserAvatar size={36} avatar={item.data.avatar} />
          </View>
          <View style={[styles.headerTextContainer]}>
            <Text style={[pal.text, s.bold]}>
              {item.data.displayName ?? 'Feed name'}
            </Text>
            <Text style={[pal.textLight, styles.description]} numberOfLines={5}>
              {item.data.description ??
                "Explore our Feed for the latest updates and insights! Dive into a world of intriguing articles, trending news, and exciting stories that cover a wide range of topics. From technology breakthroughs to lifestyle tips, there's something here for everyone. Stay informed and get inspired with us. Join the conversation now!"}
            </Text>
          </View>
        </View>

        {showBottom ? (
          <View style={styles.bottomContainer}>
            <View style={styles.likedByContainer}>
              {/* <View style={styles.likedByAvatars}>
              <UserAvatar size={24} avatar={item.data.avatar} />
              <UserAvatar size={24} avatar={item.data.avatar} />
              <UserAvatar size={24} avatar={item.data.avatar} />
            </View> */}

              <HeartIconSolid size={16} style={[s.mr2, {color: colors.red3}]} />
              <Text style={[pal.text, pal.textLight]}>
                {item.data.likeCount && item.data.likeCount > 0
                  ? `Liked by ${item.data.likeCount} ${pluralize(
                      item.data.likeCount,
                      'other',
                    )}`
                  : 'Be the first to like this'}
              </Text>
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
        ) : null}
      </TouchableOpacity>
    )
  },
)
export default AlgoItem

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: 'column',
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 18,
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
  likedByAvatars: {
    flexDirection: 'row',
    gap: -12,
  },
})
