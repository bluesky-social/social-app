import React from 'react'
import {Pressable, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {RichText} from '../util/text/RichText'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {UserAvatar} from '../util/UserAvatar'
import {observer} from 'mobx-react-lite'
import {FeedSourceModel} from 'state/models/content/feed-source'
import {useNavigation} from '@react-navigation/native'
import {NavigationProp} from 'lib/routes/types'
import {useStores} from 'state/index'
import {pluralize} from 'lib/strings/helpers'
import {AtUri} from '@atproto/api'
import * as Toast from 'view/com/util/Toast'
import {sanitizeHandle} from 'lib/strings/handles'
import {logger} from '#/logger'

export const FeedSourceCard = observer(function FeedSourceCardImpl({
  item,
  style,
  showSaveBtn = false,
  showDescription = false,
  showLikes = false,
}: {
  item: FeedSourceModel
  style?: StyleProp<ViewStyle>
  showSaveBtn?: boolean
  showDescription?: boolean
  showLikes?: boolean
}) {
  const store = useStores()
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()

  const onToggleSaved = React.useCallback(async () => {
    if (item.isSaved) {
      store.shell.openModal({
        name: 'confirm',
        title: 'Remove from my feeds',
        message: `Remove ${item.displayName} from my feeds?`,
        onPressConfirm: async () => {
          try {
            await item.unsave()
            Toast.show('Removed from my feeds')
          } catch (e) {
            Toast.show('There was an issue contacting your server')
            logger.error('Failed to unsave feed', {error: e})
          }
        },
      })
    } else {
      try {
        await item.save()
        Toast.show('Added to my feeds')
      } catch (e) {
        Toast.show('There was an issue contacting your server')
        logger.error('Failed to save feed', {error: e})
      }
    }
  }, [store, item])

  return (
    <Pressable
      testID={`feed-${item.displayName}`}
      accessibilityRole="button"
      style={[styles.container, pal.border, style]}
      onPress={() => {
        if (item.type === 'feed-generator') {
          navigation.push('ProfileFeed', {
            name: item.creatorDid,
            rkey: new AtUri(item.uri).rkey,
          })
        } else if (item.type === 'list') {
          navigation.push('ProfileList', {
            name: item.creatorDid,
            rkey: new AtUri(item.uri).rkey,
          })
        }
      }}
      key={item.uri}>
      <View style={[styles.headerContainer]}>
        <View style={[s.mr10]}>
          <UserAvatar type="algo" size={36} avatar={item.avatar} />
        </View>
        <View style={[styles.headerTextContainer]}>
          <Text style={[pal.text, s.bold]} numberOfLines={3}>
            {item.displayName}
          </Text>
          <Text style={[pal.textLight]} numberOfLines={3}>
            by {sanitizeHandle(item.creatorHandle, '@')}
          </Text>
        </View>
        {showSaveBtn && (
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                item.isSaved ? 'Remove from my feeds' : 'Add to my feeds'
              }
              accessibilityHint=""
              onPress={onToggleSaved}
              hitSlop={15}
              style={styles.btn}>
              {item.isSaved ? (
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

      {showDescription && item.descriptionRT ? (
        <RichText
          style={[pal.textLight, styles.description]}
          richText={item.descriptionRT}
          numberOfLines={3}
        />
      ) : null}

      {showLikes ? (
        <Text type="sm-medium" style={[pal.text, pal.textLight]}>
          Liked by {item.likeCount || 0}{' '}
          {pluralize(item.likeCount || 0, 'user')}
        </Text>
      ) : null}
    </Pressable>
  )
})

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
