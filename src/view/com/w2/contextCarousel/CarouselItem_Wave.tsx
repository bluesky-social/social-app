import React, {useEffect, useState} from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useStyle} from 'lib/hooks/waverly/useStyle'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {Text} from 'view/com/util/text/Text'
import {colors} from 'lib/styles'
import {
  ProfileViewBasic,
  ProfileViewDetailed,
} from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {Link} from 'view/com/util/Link'

function toBasicProfile(p: ProfileViewDetailed): ProfileViewBasic {
  return {
    did: p.did,
    handle: p.handle,
    displayName: p.displayName ?? '<Unknown group>',
    avatar: p.avatar,
  }
}

interface CarouselItem_WaveProps {
  groupPost: PostsFeedItemModel
  cardHeight: number
  isSelected: boolean
}

export const CarouselItem_Wave = observer(function CarouselItem_Wave({
  groupPost,
  cardHeight,
  isSelected,
}: CarouselItem_WaveProps) {
  const pal = usePalette('primary')
  const cardStyle = useStyle(
    () => [
      styles.borderRadius16,
      {height: cardHeight},
      isSelected
        ? {borderWidth: 2, borderColor: colors.waverly1}
        : {padding: 2}, // Invisibly pad to the same width as the border when deselected.
    ],
    [cardHeight, isSelected],
  )
  const shadowStyle = useStyle(
    () =>
      isSelected
        ? {
            shadowColor: colors.waverly1,
            shadowOpacity: 0.9,
            shadowOffset: {width: 0, height: 1}, // Required after embedding in the scrollview...
            shadowRadius: 8,
          }
        : null,
    [isSelected],
  )

  const animatedStyleScale = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: 0.64,
        },
      ],
    }
  })
  const animatedStyleTrans = useAnimatedStyle(() => {
    return {
      transform: [{translateX: 0}, {translateY: -110}],
    }
  })

  const [groupInfo, setGroupInfo] = useState<ProfileViewBasic>()
  useEffect(() => {
    if (groupPost) {
      const group = groupPost?.post.author
      if (group) setGroupInfo(toBasicProfile(group))
    }
  }, [groupPost])
  return (
    <View style={shadowStyle}>
      <Animated.View style={[animatedStyleTrans]}>
        <Animated.View style={[cardStyle, animatedStyleScale]}>
          <>
            <LinearGradient
              colors={['#ECE3FF', '#D7C3FF']}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={styles.gradient}
            />
            <View style={[styles.gradient]}>
              <View style={styles.headerContainer}>
                <Link
                  href={`/profile/${groupInfo?.handle}`}
                  asAnchor
                  anchorNoUnderline>
                  <View style={{flexDirection: 'row'}}>
                    <View style={{flex: 3, marginLeft: 6}}>
                      <UserAvatar
                        size={32}
                        avatar={groupInfo ? groupInfo.avatar : undefined}
                        type="algo"
                      />
                    </View>
                    <View style={{flex: 4, justifyContent: 'center'}}>
                      <Text
                        type="3xl-bold"
                        style={[pal.text, {color: colors.waverly1}]}>
                        Wave
                      </Text>
                    </View>
                  </View>
                </Link>
              </View>

              <View style={styles.glassCardFrame}>
                {groupInfo && <MessageContents group={groupInfo!} />}
              </View>
            </View>
          </>
        </Animated.View>
      </Animated.View>
    </View>
  )
})

interface MessageContentProps {
  group: ProfileViewBasic
}
const MessageContents = ({group}: MessageContentProps) => {
  const pal = usePalette('default')
  return (
    <View style={[cstyles.bottomContainer, pal.view]}>
      <View style={{flexShrink: 1, marginTop: 8}}>
        <View
          style={{
            flexShrink: 1,
            height: '100%',
            marginHorizontal: 16,
            marginTop: 8,
          }}>
          <View style={{gap: 32}}>
            <Text type="2xl-bold" style={pal.view}>
              {group.displayName ? group.displayName : group.handle}
            </Text>

            <View style={{flexDirection: 'column', gap: 16}}>
              <Text type="2xl">
                Below is a summary of this Wave's status and settings:
              </Text>
              <Text type="2xl">• 24 members</Text>
              <Text type="2xl">• Currently 4 people active</Text>
              <Text type="2xl">
                • Topics focused on things like apples, bananas, and currants
              </Text>
              <Text type="2xl">• All posts must contain images of fruit</Text>
            </View>
          </View>
        </View>
        <View style={{margin: 32}}>
          <SeeMore />
        </View>
      </View>
    </View>
  )
}

const SeeMore = () => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={{
        marginTop: '10%',
        alignItems: 'center',
      }}>
      <LinearGradient
        colors={[colors.waverly3, colors.waverly1]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: 12,
        }}
      />
      <Text type="2xl-bold" style={{marginVertical: 20, color: colors.white}}>
        See More
      </Text>
    </TouchableOpacity>
  )
}

const cstyles = StyleSheet.create({
  bottomContainer: {
    flexShrink: 1,
    borderRadius: 10,
    alignItems: 'stretch',
    overflow: 'hidden',
  },
})

const styles = StyleSheet.create({
  borderRadius16: {
    borderRadius: 16,
  },
  glassCardFrame: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  // From CardFrame_Full
  frameContainer: {
    gap: 0,
    padding: 0,
    borderRadius: 16,
    flex: 1,
  },
  waverlyCardColor: {
    backgroundColor: '#ffffff4C',
  },
  // From CardHeader_Full
  headerContainer: {
    marginHorizontal: 8,
    marginTop: 9,
    marginBottom: 9,
  },
  // Home Icon
  ctrlIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
})
