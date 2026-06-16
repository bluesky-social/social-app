import {useEffect, useRef, useState} from 'react'
import {Pressable, useWindowDimensions} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {useLingui} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useCatCompanion} from '#/state/preferences/cat-companion'
import {useSession} from '#/state/session'
import {useShellLayout} from '#/state/shell/shell-layout'
import {IS_WEB} from '#/env'
import {type CatColor, type CatState, isLoopState} from './catalog'
import {CatSprite} from './CatSprite'

// On-screen size of the companion. This need not be a multiple of the 64px
// sprite cell: CatSprite renders the art at an integer scale and downsamples
// to fit, so non-integer sizes stay crisp instead of shimmering.
const SIZE = 88
// Horizontal padding kept clear of the screen edges while wandering.
const EDGE_MARGIN = 6
// Walking speed, in px/second of on-screen travel.
const WALK_SPEED = 60
const MIN_WALK_MS = 700
// Chance the cat decides to wander rather than rest on any given decision.
const WALK_CHANCE = 0.45

// Looping "doing nothing" states and how long to hold each, in ms.
const AMBIENT: {state: CatState; min: number; max: number}[] = [
  {state: 'Idle', min: 4000, max: 8000},
  {state: 'Chilling', min: 6000, max: 12000},
  {state: 'Happy', min: 6000, max: 12000}, // content loaf
  {state: 'Sleeping', min: 12000, max: 22000},
]

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]

/**
 * A small companion cat that wanders along the bottom of the screen (on top of
 * the bottom navbar on mobile) and reacts when you pet it. Gated behind the
 * `catCompanion` preference and an active session so it cleanly unmounts when
 * turned off.
 */
export function CatCompanion() {
  const {enabled, color} = useCatCompanion()
  const {hasSession} = useSession()

  if (!enabled || !hasSession) return null

  return <CatCompanionInner color={color} />
}

function CatCompanionInner({color}: {color: CatColor}) {
  const {t: l} = useLingui()
  const {width} = useWindowDimensions()
  // The shell measures the real tab-bar height into footerHeight (both native
  // and BottomBarWeb), so the cat sits right on top of it. It's 0 on web
  // desktop, where there's no bottom bar, so the cat rests at the very bottom.
  const {footerHeight} = useShellLayout()
  const haptics = useHaptics()

  const [state, setState] = useState<CatState>('Idle')
  const [facing, setFacing] = useState<1 | -1>(1)
  // Bumped to replay one-shot reactions when petted repeatedly.
  const [playToken, setPlayToken] = useState(0)

  // Start roughly centered.
  const startX = Math.max(EDGE_MARGIN, width / 2 - SIZE / 2)
  const tx = useSharedValue(startX)
  // JS-thread mirror of the cat's resting x, used to plan the next walk.
  const posRef = useRef(startX)
  // Latest viewport width, read inside scheduled callbacks.
  const widthRef = useRef(width)
  useEffect(() => {
    widthRef.current = width
  }, [width])

  // Pending rest/reaction timer.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Invalidates an in-flight walk's arrival callback when interrupted.
  const genRef = useRef(0)
  // The director loop, kept in a ref so event handlers can re-enter it.
  const startActionRef = useRef<() => void>(() => {})

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    const maxX = () =>
      Math.max(EDGE_MARGIN, widthRef.current - SIZE - EDGE_MARGIN)

    const onArrive = (target: number, myGen: number) => {
      if (myGen !== genRef.current) return
      posRef.current = target
      startAction()
    }

    const walk = () => {
      const target = rand(EDGE_MARGIN, maxX())
      const goingRight = target > posRef.current
      // The running art gallops to the right as authored; mirror (facing -1)
      // to walk left.
      setFacing(goingRight ? 1 : -1)
      setState('Running')

      const distance = Math.abs(target - posRef.current)
      const duration = Math.max(MIN_WALK_MS, (distance / WALK_SPEED) * 1000)
      const myGen = ++genRef.current
      tx.value = withTiming(
        target,
        {duration, easing: Easing.linear},
        finished => {
          'worklet'
          if (finished) runOnJS(onArrive)(target, myGen)
        },
      )
    }

    const rest = () => {
      const next = pick(AMBIENT)
      setState(next.state)
      timerRef.current = setTimeout(startAction, rand(next.min, next.max))
    }

    function startAction() {
      clearTimer()
      if (Math.random() < WALK_CHANCE) {
        walk()
      } else {
        rest()
      }
    }

    startActionRef.current = startAction

    // Kick things off after a short beat so the cat "arrives".
    timerRef.current = setTimeout(startAction, 800)

    return () => {
      clearTimer()
      cancelAnimation(tx)
      genRef.current++
    }
  }, [tx])

  // Pause briefly after a reaction, then hand control back to the director.
  const resumeWandering = () => {
    clearTimer()
    setState('Idle')
    timerRef.current = setTimeout(
      () => startActionRef.current(),
      rand(900, 2000),
    )
  }

  const onPet = () => {
    // Stop whatever the cat was doing and freeze it in place.
    clearTimer()
    genRef.current++
    cancelAnimation(tx)
    posRef.current = tx.value

    haptics('Light')

    // Petting makes the cat react: a quick "Excited" pop or the content
    // "Happy" loaf, picked at random.
    const reaction: CatState = Math.random() < 0.5 ? 'Excited' : 'Happy'
    setPlayToken(t => t + 1)
    setState(reaction)
    if (isLoopState(reaction)) {
      // Happy loops, so hold it briefly then resume on our own.
      timerRef.current = setTimeout(resumeWandering, 2600)
    }
    // Excited is a one-shot; CatSprite.onAnimationEnd resumes wandering.
  }

  const onAnimationEnd = () => {
    // Only reactions are one-shots, so this means a reaction just finished.
    resumeWandering()
  }

  const animatedStyle = useAnimatedStyle(() => ({
    bottom: footerHeight.value,
    transform: [{translateX: tx.value}],
  }))

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          // Pin to the viewport on web so the cat doesn't scroll with content.
          // 'fixed' is web-only; cast keeps the RN ViewStyle type happy.
          position: (IS_WEB ? 'fixed' : 'absolute') as 'absolute',
          left: 0,
          width: SIZE,
          height: SIZE,
        },
        animatedStyle,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={l`Pet the cat`}
        accessibilityHint={l`Plays a happy reaction`}
        onPress={onPet}>
        <CatSprite
          color={color}
          state={state}
          facing={facing}
          size={SIZE}
          playToken={playToken}
          onAnimationEnd={onAnimationEnd}
        />
      </Pressable>
    </Animated.View>
  )
}
