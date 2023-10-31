import React from 'react'
import {usePalette} from 'lib/hooks/usePalette'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {useStyle} from 'lib/hooks/waverly/useStyle'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {Text} from 'view/com/util/text/Text'
import {colors} from 'lib/styles'
import {HomeIcon} from 'lib/icons'
import {CarouselItem_Card} from './CarouselItem_Card'
import {PostsFeedItemModel} from 'state/models/feeds/post'

interface CarouselItem_FeedProps {
  groupPost: PostsFeedItemModel
  cardHeight: number
  isSelected: boolean
}

export const CarouselItem_Feed = observer(function CarouselItem_Feed({
  groupPost,
  cardHeight,
  isSelected,
}: CarouselItem_FeedProps) {
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

  return (
    <View style={shadowStyle} pointerEvents="none">
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
                <View style={{flexDirection: 'row'}}>
                  <View style={{flex: 3}}>
                    <HomeIcon
                      strokeWidth={4}
                      size={32}
                      style={[
                        pal.text,
                        {color: colors.waverly1, marginLeft: 8},
                      ]}
                    />
                  </View>
                  <View style={{flex: 4, justifyContent: 'center'}}>
                    <Text
                      type="3xl-bold"
                      style={[pal.text, {color: colors.waverly1}]}>
                      Feed
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.glassCardFrame}>
                <MessageContents
                  groupPost={groupPost}
                  cardHeight={cardHeight}
                />
              </View>
            </View>
          </>
        </Animated.View>
      </Animated.View>
    </View>
  )
})

interface MessageContensProps {
  groupPost: PostsFeedItemModel
  cardHeight: number
}

const MessageContents = ({groupPost, cardHeight}: MessageContensProps) => {
  const pal = usePalette('default')
  return (
    <View style={[cstyles.bottomContainer, pal.view]}>
      <View style={{flexShrink: 1, marginTop: 8}}>
        <View
          style={{
            flexShrink: 1,
            height: '100%',
            marginHorizontal: 16,
          }}>
          <View style={{top: '75%'}}>
            <Text type="3xl" style={{textAlign: 'center', zIndex: 1}}>
              Control what you see in your feed and understand how Waverly
              recommends content.
            </Text>
          </View>
          <CarouselItem_Card
            groupPost={groupPost}
            cardHeight={cardHeight * 0.8}
            isSelected={false}
          />
        </View>
      </View>
    </View>
  )
}

const cstyles = StyleSheet.create({
  bottomContainer: {
    // flexShrink: 1,
    borderRadius: 10,
    // alignItems: 'stretch',
    // overflow: 'hidden',
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
