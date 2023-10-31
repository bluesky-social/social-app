import React, {useEffect, useCallback, useState} from 'react'
import {
  Animated,
  StyleSheet,
  LayoutChangeEvent,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native'
import {observer} from 'mobx-react-lite'
import useCardBrowser, {
  CardSize,
} from '../../../../lib/hooks/waverly/useCardBrowser'
import {GroupFeedModel} from 'state/models/feeds/waverly/group-feed'
import {PostsFeedItemModel} from 'state/models/feeds/post'
import {CardFrame} from '../card/CardFrame'
import {CardFrame_Full} from '../card/CardFrame_Full'
import LinearGradient from 'react-native-linear-gradient'
//import {CardBody} from '../card/CardBody'
import {CardBody_Full} from '../card/CardBody_Full'
import {useStores} from 'state/index'
import {Recommendation} from 'w2-api/waverly_sdk'
import {WaverlyCardBody} from '../card/WaverlyCardBody'
import {FabPickable} from '../web-reader/DraggableFab'
import {PickerContext} from '../util/PickerContext'
import {s} from 'lib/styles'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useStyle} from 'lib/hooks/waverly/useStyle'

interface SimpleCard {
  groupPost?: PostsFeedItemModel
  rec?: Recommendation
  height: CardSize
}

interface GradientConfig {
  from: string
  to: string
}
const GRADIENTS: GradientConfig[] = [
  {from: '#F3E9D4', to: '#29C5B2'},
  {from: '#B97DD4', to: '#F5AB68'},
  {from: '#D8D2CC', to: '#4F2629'},
  {from: '#CFC6C7', to: '#393943'},
  {from: '#CADFE9', to: '#20759A'},
]

function rgbToHex(r: number, g: number, b: number) {
  r = Math.floor(r)
  g = Math.floor(g)
  b = Math.floor(b)
  // eslint-disable-next-line no-bitwise
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

function hexToRGB(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function blendcolors(
  t: number,
  r: number,
  g: number,
  b: number,
  r1: number,
  g1: number,
  b1: number,
) {
  const outR = r + (r1 - r) * t
  const outG = g + (g1 - g) * t
  const outB = b + (b1 - b) * t
  return {r: outR, g: outG, b: outB}
}

interface Props {
  marginStyle?: StyleProp<ViewStyle>
  groupFeedModel?: GroupFeedModel
}

export const CardBrowser = observer(function CardBrowser({
  marginStyle,
  groupFeedModel,
}: Props) {
  const {
    currCardIdx,
    setContainerHeight,
    insertCards,
    //deleteCard, // Unused
    deleteAllCards,
    //setCardHeight, // Unused
    panResponder,
    getCardGeometry,
  } = useCardBrowser({
    topBehavior: 'bounce',
  })
  const store = useStores()

  const [prevCardIdx, setPrevCardIndex] = useState<number | undefined>()
  const [cards, setCards] = useState<SimpleCard[]>([])

  const containerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setContainerHeight(event.nativeEvent.layout.height)
    },
    [setContainerHeight],
  )

  const [gradBlend, setGradBlend] = useState<number>(0)
  const gradBlendVal = useAnimatedValue(0)

  useEffect(() => {
    gradBlendVal.addListener(({value}) => {
      setGradBlend(value)
    })
    return () => {
      gradBlendVal.removeAllListeners()
    }
  }, [gradBlendVal])

  // Card index to use when computing card gradients.
  const [gradCardIndex, setGradCardIndex] = useState<number | undefined>()

  // Clear picking geometry every time the feed moves to a different card.
  useEffect(() => {
    if (currCardIdx !== prevCardIdx) {
      // Record the previous card index, for computing gradients.
      setGradCardIndex(prevCardIdx)

      // Reset the card gradient blending
      gradBlendVal.setValue(0)
      Animated.timing(gradBlendVal, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
        isInteraction: false,
      }).start()

      // Clear picking data.
      store.shell.pickableData.clear()
      store.shell.clearHitting()
      setPrevCardIndex(currCardIdx)
    }
  }, [
    currCardIdx,
    gradBlendVal,
    prevCardIdx,
    store.shell,
    store.shell.pickableData,
  ])

  // Set context every time the feed moves to a different card.
  useEffect(() => {
    let activePost: PostsFeedItemModel | undefined
    let activeRec: Recommendation | undefined
    if (currCardIdx !== undefined) {
      activePost = cards[currCardIdx].groupPost
      activeRec = cards[currCardIdx].rec
    }
    store.waverlyContext.set('activePost', activePost)
    store.waverlyContext.set('activeRec', activeRec)
  }, [cards, currCardIdx, store.waverlyContext])

  useEffect(() => {
    // Initial insert
    if (
      !groupFeedModel ||
      groupFeedModel.isLoading ||
      !groupFeedModel.hasLoaded ||
      !groupFeedModel.feed
    ) {
      setCards([])
    } else {
      const filtered = groupFeedModel.feed.filter((i: any) => {
        if (i?.post || i?.id) return true
        else {
          store.log.warn('Invalid card received.')
          return false
        }
      })

      setCards(
        filtered.map((i: any) => {
          if (i.post) return {groupPost: i, height: 'full'}
          else return {rec: i, height: 'full'}
        }),
      )
      deleteAllCards()
      insertCards(
        groupFeedModel.feed.map(() => 'full'),
        0,
      )
    }
  }, [
    groupFeedModel,
    groupFeedModel?.isLoading,
    groupFeedModel?.hasLoaded,
    groupFeedModel?.feed,
    deleteAllCards,
    insertCards,
    store.log,
  ])

  const prevGradient = gradCardIndex
    ? GRADIENTS[gradCardIndex % GRADIENTS.length]
    : GRADIENTS[0]
  const curGradient = currCardIdx
    ? GRADIENTS[currCardIdx % GRADIENTS.length]
    : GRADIENTS[0]

  const [useGradient, setUseGradient] = useState<GradientConfig>(GRADIENTS[0])

  useEffect(() => {
    if (gradBlend <= 0 || gradBlend >= 1) return
    const from0 = hexToRGB(prevGradient.from)
    const from1 = hexToRGB(curGradient.from)
    let fromHex: string = ''
    let toHex: string = ''
    if (from0 && from1) {
      const {r, g, b} = blendcolors(
        gradBlend,
        from0.r,
        from0.g,
        from0.b,
        from1.r,
        from1.g,
        from1.b,
      )
      fromHex = rgbToHex(Math.floor(r), Math.floor(g), Math.floor(b))
    }
    const to0 = hexToRGB(prevGradient.to)
    const to1 = hexToRGB(curGradient.to)
    if (to0 && to1) {
      const {r, g, b} = blendcolors(
        gradBlend,
        to0.r,
        to0.g,
        to0.b,
        to1.r,
        to1.g,
        to1.b,
      )
      toHex = rgbToHex(Math.floor(r), Math.floor(g), Math.floor(b))
    }
    setUseGradient({from: fromHex, to: toHex})
  }, [
    curGradient.from,
    curGradient.to,
    gradBlend,
    prevGradient.from,
    prevGradient.to,
  ])

  // const bottom = useSharedValue(0)
  // const animatedFullContainer = useAnimatedStyle(() => {
  //   return {
  //     position: 'absolute',
  //     top: 0,
  //     left: 0,
  //     right: 0,
  //     bottom: withTiming(bottom.value),
  //   }
  // })

  const glassCardFrameStyle = useStyle(
    () => [
      {
        flex: 1,
        marginHorizontal: 8,
        overflow: 'hidden',
      },
      marginStyle,
    ],
    [marginStyle],
  )

  return (
    <>
      <LinearGradient
        colors={[useGradient.from, useGradient.to]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradient}
      />
      <Animated.View
        style={styles.fullContainer}
        {...panResponder.panHandlers}
        onLayout={containerLayout}>
        <>
          {cards.map((card, i) => {
            const geometry = getCardGeometry(i)
            if (!geometry) {
              return null
            }
            return (
              <PickerContext.Provider
                key={i}
                value={{
                  isPicking: store.shell.hasFabMoved && i === currCardIdx,
                  isPressing: store.shell.hasFabMoved,
                  hitting: store.shell.hitting.pickID,
                }}>
                <Animated.View
                  style={{
                    ...styles.stretchBox,
                    height: geometry.height,
                    transform: [{translateY: geometry.translateY}],
                  }}>
                  <View style={glassCardFrameStyle}>
                    {card.groupPost ? (
                      <Card_UGC groupPost={card.groupPost} cardIndex={i} />
                    ) : card.rec ? (
                      <Card_WaverlyRec rec={card.rec} cardIndex={i} />
                    ) : null}
                  </View>
                </Animated.View>
              </PickerContext.Provider>
            )
          })}
        </>
      </Animated.View>
    </>
  )
})

interface Card_UGC_Props {
  groupPost: PostsFeedItemModel
  cardIndex: number
}
const Card_UGC = ({groupPost, cardIndex}: Card_UGC_Props) => {
  return (
    <CardFrame_Full groupPost={groupPost}>
      <FabPickable
        pickID={`card_${cardIndex}`}
        data={groupPost}
        type={'UGCBody'}
        style={s.flex1}>
        <CardBody_Full groupPost={groupPost} />
      </FabPickable>
    </CardFrame_Full>
  )
}

interface Card_WaverlyRec_Props {
  rec: Recommendation
  cardIndex: number
}
const Card_WaverlyRec = ({rec, cardIndex}: Card_WaverlyRec_Props) => {
  return (
    <CardFrame rec={rec}>
      <FabPickable
        pickID={`waverlyRec_${cardIndex}`}
        data={rec}
        type={'RecBody'}
        style={s.flex1}>
        <WaverlyCardBody rec={rec} />
      </FabPickable>
    </CardFrame>
  )
}

const styles = StyleSheet.create({
  fullContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stretchBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'stretch',
  },
})
