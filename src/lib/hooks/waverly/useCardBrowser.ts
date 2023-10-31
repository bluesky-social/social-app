import {useRef, useEffect, useCallback, useState} from 'react'
import {Animated, PanResponder, PanResponderInstance} from 'react-native'
import {
  Ranges,
  appendRanges,
  bounceInterpolation,
  decayAnimation,
  springAnimation,
  stopInterpolation,
} from '../../waverly/anim-helper'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useAnimatedValueXY} from './useAnimatedValueXY'

const MIN_VELOCITY_TO_TRIGGER_DECAY = 0.1
const PERCENTAGE_OF_HEIGHT_TO_TRIGGER_CARD_SWITCH = 1.0 // Must be > 0.5
const PERCENTAGE_OF_HEIGHT_TO_TRIGGER_CARD_SNAP = 0.3
const VELOCITY_TO_TRIGGER_SNAP = 1
const CARDS_TO_RENDER = 5 // Must be odd and at least 3

const CURR_CARD_I = (CARDS_TO_RENDER - 1) / 2

interface CumulativeSize {
  numFullCards: number
  height: number
}

export type CardSize = number | 'full'

interface CardSizeInternal {
  height: CardSize
  cumulativeSizeBefore?: CumulativeSize
}

interface Trigger {
  changeY: number
  snapY: number
  snapV: number
}

interface Triggers {
  prev: Trigger
  next: Trigger
}

export interface CardGeometry {
  translateY: number | Animated.Value | Animated.AnimatedInterpolation<number>
  height: number
}

export interface CardBrowser {
  currCardIdx: number | undefined
  setContainerHeight: (containerHeight: number) => void
  insertCards: (cardSizes: CardSize[], beforeIdx: number) => void
  deleteCard: (idx: number) => void
  deleteAllCards: () => void
  setCardHeight: (idx: number, height: CardSize) => void
  panResponder: PanResponderInstance
  getCardGeometry: (cardIdx: number) => CardGeometry | null
}

export type Behavior = 'bounce' | 'stop'

export interface Props {
  topBehavior?: Behavior
  bottomBehavior?: Behavior
}

const useCardBrowser = (props?: Props): CardBrowser => {
  const {topBehavior = 'bounce', bottomBehavior = 'bounce'} = props ?? {}

  const cards = useRef<CardSizeInternal[]>([]).current
  const panVal = useAnimatedValueXY()
  const pan = useRef({x: 0, y: 0}).current
  const velocityVal = useAnimatedValueXY()
  const velocity = useRef({x: 0, y: 0}).current
  const stackTopVal = useAnimatedValue(0)
  const stackPos = useRef({top: 0, bottom: 0}).current
  const cardsTopVal = useRef<Animated.Value[]>(
    [...Array(CARDS_TO_RENDER)].map(() => new Animated.Value(0)),
  ).current
  const cardsGeometry = useRef<{top: number; bottom: number}[]>(
    [...Array(CARDS_TO_RENDER)].map(() => ({top: 0, bottom: 0})),
  ).current
  const currCard = useRef<{idx?: number}>({}).current

  const triggers = useRef<Triggers>({
    prev: {changeY: 0, snapY: 0, snapV: 0},
    next: {changeY: 0, snapY: 0, snapV: 0},
  }).current
  const containerSize = useRef<{height?: number}>({}).current
  const animState = useRef({isDecaying: false}).current
  const interpolation = useRef<Ranges>({
    inputRange: [0, 1],
    outputRange: [0, 1],
  }).current

  // The states below are used to broadcast externally, they should not be used
  // internally.
  const [currCardIdxExt, setCurrCardIdxExt] = useState<number | undefined>()
  const [containerHeightExt, setContainerHeightExt] = useState<
    number | undefined
  >()

  // A state just to force rerender
  const [, setRenderCount] = useState(0)

  const computeCardPos = useCallback(
    (cardIdx: number | undefined): {top: number; bottom: number} => {
      const card = cardIdx === undefined ? undefined : cards[cardIdx]
      const height = containerSize.height
      if (card === undefined || height === undefined) return {top: 0, bottom: 0}
      const cumulative = card.cumulativeSizeBefore
      if (!cumulative)
        throw 'Must compute cumulativeSizeBefore to computeCardTop'
      const top =
        stackPos.top + cumulative.numFullCards * height + cumulative.height
      const bottom = top + (card.height === 'full' ? height : card.height)

      return {top, bottom}
    },
    [cards, containerSize, stackPos],
  )

  const calcInterpolation = useCallback(() => {
    if (cards.length === 0) return
    const containerHeight = containerSize.height ?? 0
    const lastCard = cards[cards.length - 1]
    const lastCardHeight =
      lastCard.height === 'full' ? containerHeight : lastCard.height
    const top = -stackPos.top
    const bottom = -stackPos.bottom + Math.min(lastCardHeight, containerHeight)
    const topInterpolation =
      topBehavior === 'bounce'
        ? bounceInterpolation(top, 'top')
        : stopInterpolation(top, 'top')
    const bottomInterpolation =
      bottomBehavior === 'bounce'
        ? bounceInterpolation(bottom, 'bottom')
        : stopInterpolation(bottom, 'bottom')

    const result = appendRanges(bottomInterpolation, topInterpolation)
    interpolation.inputRange = result.inputRange
    interpolation.outputRange = result.outputRange
  }, [
    bottomBehavior,
    cards,
    containerSize,
    interpolation,
    stackPos,
    topBehavior,
  ])

  const computeCumulativeSize = useCallback(() => {
    const curr: CumulativeSize = {numFullCards: 0, height: 0}
    for (const card of cards) {
      card.cumulativeSizeBefore = {...curr}
      if (card.height === 'full') curr.numFullCards++
      else curr.height += card.height
    }
    stackPos.bottom =
      stackPos.top +
      curr.numFullCards * (containerSize.height ?? 0) +
      curr.height
    calcInterpolation()
  }, [calcInterpolation, cards, containerSize, stackPos])

  const startSnapTo = useCallback(
    (targetY: number) => {
      animState.isDecaying = false
      panVal.stopAnimation()
      springAnimation(panVal.y, targetY, velocity.y).start()
    },
    [animState, panVal, velocity],
  )

  const startSnapIfNeeded = useCallback(
    (panY: number) => {
      const geometry = cardsGeometry[CURR_CARD_I]
      const height = geometry.bottom - geometry.top
      const panAtTop = -geometry.top
      const panAtBottom =
        -geometry.bottom + Math.min(height, containerSize.height ?? 0)
      if (panY <= panAtTop && panY >= panAtBottom) return
      const target = panY > panAtTop ? panAtTop : panAtBottom
      startSnapTo(target)
    },
    [cardsGeometry, containerSize, startSnapTo],
  )

  const startDecay = useCallback(() => {
    panVal.stopAnimation()
    decayAnimation(panVal.y, velocity.y).start()
    animState.isDecaying = true
  }, [animState, panVal, velocity])

  const calcTriggers = useCallback(() => {
    const containerHeight = containerSize.height ?? 0
    const geometry = cardsGeometry[CURR_CARD_I]
    if (currCard.idx === 0) {
      triggers.prev.changeY = Number.POSITIVE_INFINITY
      triggers.prev.snapY = Number.POSITIVE_INFINITY
      triggers.prev.snapV = Number.POSITIVE_INFINITY
    } else {
      const prevGeometry = cardsGeometry[CURR_CARD_I - 1]
      const prevHeight = prevGeometry.bottom - prevGeometry.top
      const height = Math.min(prevHeight, containerHeight)
      triggers.prev.changeY =
        -geometry.top + height * PERCENTAGE_OF_HEIGHT_TO_TRIGGER_CARD_SWITCH
      triggers.prev.snapY =
        -geometry.top + height * PERCENTAGE_OF_HEIGHT_TO_TRIGGER_CARD_SNAP
      triggers.prev.snapV = VELOCITY_TO_TRIGGER_SNAP
    }
    if (currCard.idx === cards.length - 1) {
      triggers.next.changeY = Number.NEGATIVE_INFINITY
      triggers.next.snapY = Number.NEGATIVE_INFINITY
      triggers.next.snapV = Number.NEGATIVE_INFINITY
    } else {
      const currHeight = geometry.bottom - geometry.top
      const height = Math.min(currHeight, containerHeight)
      triggers.next.changeY =
        -geometry.bottom +
        height * (1 - PERCENTAGE_OF_HEIGHT_TO_TRIGGER_CARD_SWITCH)
      triggers.next.snapY =
        -geometry.bottom +
        height * (1 - PERCENTAGE_OF_HEIGHT_TO_TRIGGER_CARD_SNAP)
      triggers.next.snapV = -VELOCITY_TO_TRIGGER_SNAP
    }
  }, [cards, cardsGeometry, containerSize, currCard, triggers])

  const calcActiveCardsPos = useCallback(() => {
    if (CARDS_TO_RENDER % 2 !== 1) throw 'CARDS_TO_RENDER must be odd'
    if (currCard.idx === undefined) return

    let currIdx = currCard.idx - CURR_CARD_I
    for (let i = 0; i < CARDS_TO_RENDER; ++i, ++currIdx) {
      if (currIdx < 0 || currIdx >= cards.length) continue
      const cardPos = computeCardPos(currIdx)
      cardsTopVal[i].setValue(cardPos.top)
      cardsGeometry[i] = {...cardPos}
    }

    calcTriggers()
  }, [
    calcTriggers,
    cards,
    cardsGeometry,
    cardsTopVal,
    computeCardPos,
    currCard,
  ])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panVal.stopAnimation()
        animState.isDecaying = false
        panVal.extractOffset()
      },
      onPanResponderMove: Animated.event(
        [
          null,
          {dx: panVal.x, dy: panVal.y, vx: velocityVal.x, vy: velocityVal.y},
        ],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => {
        panVal.flattenOffset()
        const containerHeight = containerSize.height ?? 0

        const geometry = cardsGeometry[CURR_CARD_I]
        const height = geometry.bottom - geometry.top
        const vy = velocity.y
        const atTop = pan.y >= -geometry.top
        const atBottom =
          pan.y <= -geometry.bottom + Math.min(containerHeight, height)

        if (
          pan.y > triggers.prev.snapY ||
          (atTop && vy > triggers.prev.snapV)
        ) {
          const prevGeometry = cardsGeometry[CURR_CARD_I - 1]
          const prevHeight = prevGeometry.bottom - prevGeometry.top
          startSnapTo(-geometry.top + Math.min(containerHeight, prevHeight))
        } else if (
          pan.y < triggers.next.snapY ||
          (atBottom && vy < triggers.next.snapV)
        ) {
          startSnapTo(-geometry.bottom)
        } else if (Math.abs(vy) > MIN_VELOCITY_TO_TRIGGER_DECAY) {
          startDecay()
        } else {
          startSnapIfNeeded(pan.y)
        }
      },
    }),
  ).current

  const setCurrCardInt = useCallback(
    (idx: number | undefined) => {
      currCard.idx = idx
      setCurrCardIdxExt(currCard.idx)
      calcActiveCardsPos()
    },
    [calcActiveCardsPos, currCard],
  )

  const panValListener = useCallback(
    (state: {x: number; y: number}) => {
      ;({x: pan.x, y: pan.y} = state)
      if (currCard.idx === undefined) return
      if (state.y > triggers.prev.changeY) {
        setCurrCardInt(currCard.idx - 1)
      } else if (state.y < triggers.next.changeY) {
        setCurrCardInt(currCard.idx + 1)
      } else if (animState.isDecaying) startSnapIfNeeded(state.y)
    },
    [animState, currCard, pan, setCurrCardInt, startSnapIfNeeded, triggers],
  )

  useEffect(() => {
    panVal.addListener(panValListener)
    return () => {
      panVal.removeAllListeners()
    }
  }, [panVal, panValListener])

  useEffect(() => {
    velocityVal.addListener(state => {
      ;({x: velocity.x, y: velocity.y} = state)
    })
    return () => {
      velocityVal.removeAllListeners()
    }
  }, [velocity, velocityVal])

  const ensurePosUnchanged = useCallback(
    (cardIdx: number | undefined, prevTop: number) => {
      const newTop = computeCardPos(cardIdx).top
      const diff = prevTop - newTop
      stackPos.top += diff
      stackPos.bottom += diff
      stackTopVal.setValue(stackPos.top)
      calcInterpolation()
    },
    [calcInterpolation, computeCardPos, stackPos, stackTopVal],
  )

  ////////////////////////////
  // Methods below are meant to be used externally (directly or indirectly)

  // Container size changed
  useEffect(() => {
    if (containerSize.height === containerHeightExt) return
    const prevTop = computeCardPos(currCard.idx).top
    containerSize.height = containerHeightExt
    ensurePosUnchanged(currCard.idx, prevTop)
    calcActiveCardsPos()
    stackPos.bottom = computeCardPos(cards.length - 1).bottom
    calcInterpolation()
    setRenderCount(v => v + 1)
  }, [
    calcActiveCardsPos,
    calcInterpolation,
    cards,
    cardsGeometry,
    computeCardPos,
    containerHeightExt,
    containerSize,
    currCard,
    ensurePosUnchanged,
    stackPos,
  ])

  const getCardHeightExt = useCallback(
    (cardIdx: number): number => {
      // Assumes cardIdx has been bound-checked
      const height = cards[cardIdx].height
      return height === 'full' ? containerHeightExt ?? 0 : height
    },
    [cards, containerHeightExt],
  )

  const getCardGeometryExt = useCallback(
    (cardIdx: number) => {
      if (cardIdx < 0 || cardIdx >= cards.length || currCard.idx === undefined)
        return null
      const i = cardIdx - currCard.idx + CURR_CARD_I
      if (i < 0 || i >= CARDS_TO_RENDER) return null
      const height = getCardHeightExt(cardIdx)
      return {
        translateY: Animated.add(
          cardsTopVal[i],
          panVal.y.interpolate(interpolation),
        ),
        height,
      }
    },
    [cards, currCard, getCardHeightExt, cardsTopVal, panVal.y, interpolation],
  )

  const insertCards = useCallback(
    (cardSizes: CardSize[], beforeIdx: number) => {
      if (cardSizes.length === 0) return
      const toInsert = cardSizes.map(cs => ({height: cs}))
      const prevTop = computeCardPos(currCard.idx).top
      cards.splice(beforeIdx, 0, ...toInsert)
      computeCumulativeSize()
      const newCardIdx =
        currCard.idx === undefined
          ? 0
          : currCard.idx < beforeIdx
          ? currCard.idx
          : currCard.idx + cardSizes.length
      ensurePosUnchanged(newCardIdx, prevTop)
      setCurrCardInt(newCardIdx)
      setRenderCount(v => v + 1)
    },
    [
      cards,
      computeCardPos,
      computeCumulativeSize,
      currCard,
      ensurePosUnchanged,
      setCurrCardInt,
    ],
  )

  const deleteCard = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= cards.length) throw 'Invalid index'
      const deleteCurrent = idx === currCard.idx
      const prevTop = computeCardPos(currCard.idx).top
      cards.splice(idx, 1)
      computeCumulativeSize()
      const newCardIdx =
        cards.length === 0 || currCard.idx === undefined
          ? undefined
          : currCard.idx <= idx
          ? Math.min(currCard.idx, cards.length - 1)
          : currCard.idx - 1
      if (!deleteCurrent) ensurePosUnchanged(newCardIdx, prevTop)
      setRenderCount(v => v + 1)
      setCurrCardInt(newCardIdx)
      if (deleteCurrent && newCardIdx !== undefined) {
        startSnapTo(-cardsGeometry[CURR_CARD_I].top)
      }
    },
    [
      cards,
      cardsGeometry,
      computeCardPos,
      computeCumulativeSize,
      currCard,
      ensurePosUnchanged,
      setCurrCardInt,
      startSnapTo,
    ],
  )

  const deleteAllCards = useCallback(() => {
    cards.splice(0)
    setRenderCount(v => v + 1)
    setCurrCardInt(undefined)
    stackPos.top = 0
    stackPos.bottom = 0
  }, [cards, setCurrCardInt, stackPos])

  const setCardHeight = useCallback(
    (idx: number, height: CardSize) => {
      if (idx < 0 || idx >= cards.length) throw 'Invalid index'
      const prevTop = computeCardPos(currCard.idx).top
      cards[idx].height = height
      computeCumulativeSize()
      ensurePosUnchanged(currCard.idx, prevTop)
      setRenderCount(v => v + 1)
      calcActiveCardsPos()
    },
    [
      calcActiveCardsPos,
      cards,
      computeCardPos,
      computeCumulativeSize,
      currCard,
      ensurePosUnchanged,
    ],
  )

  return {
    currCardIdx: currCardIdxExt,
    setContainerHeight: setContainerHeightExt,
    insertCards,
    deleteCard,
    deleteAllCards,
    setCardHeight,
    panResponder,
    getCardGeometry: getCardGeometryExt,
  }
}

export default useCardBrowser
