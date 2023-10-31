import React from 'react'
import {observer} from 'mobx-react-lite'
import {View, StyleSheet} from 'react-native'
import {CardFrame_Full} from 'view/com/w2/card/CardFrame_Full'
import {CardBody_Full} from 'view/com/w2/card/CardBody_Full'
import LinearGradient from 'react-native-linear-gradient'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {useStyle} from 'lib/hooks/waverly/useStyle'
import Animated, {useAnimatedStyle} from 'react-native-reanimated'
import {colors} from 'lib/styles'

interface CarouselItem_CardProps {
  groupPost: PostsFeedItemModel
  cardHeight: number
  isSelected: boolean
}

export const CarouselItem_Card = observer(function CarouselItem_Card({
  groupPost,
  cardHeight,
  isSelected,
}: CarouselItem_CardProps) {
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
              colors={['#F3E9D4', '#29C5B2']} // TODO: pick up gradient colors from the Wave.
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={styles.gradient}
            />
            <View style={styles.glassCardFrame}>
              <CardFrame_Full groupPost={groupPost}>
                <CardBody_Full groupPost={groupPost} />
              </CardFrame_Full>
            </View>
          </>
        </Animated.View>
      </Animated.View>
    </View>
  )
})

const styles = StyleSheet.create({
  borderRadius16: {
    borderRadius: 16,
  },
  glassCardFrame: {
    flex: 1,
    marginHorizontal: 8,
    marginTop: 8,
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
})
