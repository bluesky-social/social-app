import {useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'

import {atoms as a, web} from '#/alf'
import {CAT_SHEETS} from './assets'
import {
  type CatColor,
  type CatState,
  CLIPS,
  COLS,
  FRAME,
  isLoopState,
  ROWS,
} from './catalog'

const DEFAULT_SIZE = 88

export function CatSprite({
  color,
  state,
  size = DEFAULT_SIZE,
  facing = 1,
  // Bump to replay a one-shot animation even when `state` is unchanged.
  playToken = 0,
  onAnimationEnd,
}: {
  color: CatColor
  state: CatState
  size?: number
  facing?: 1 | -1
  playToken?: number
  onAnimationEnd?: () => void
}) {
  const clip = CLIPS[state]
  const loop = isLoopState(state)
  const [frame, setFrame] = useState(0)

  // Reset to the first frame whenever the animation changes (or a one-shot is
  // replayed via playToken). Adjusting state during render is the React-
  // recommended alternative to doing it in an effect.
  const animationKey = `${state}:${playToken}`
  const [prevAnimationKey, setPrevAnimationKey] = useState(animationKey)
  if (animationKey !== prevAnimationKey) {
    setPrevAnimationKey(animationKey)
    setFrame(0)
  }

  // Keep the latest callback without restarting the timer.
  const onEndRef = useRef(onAnimationEnd)
  useEffect(() => {
    onEndRef.current = onAnimationEnd
  })

  useEffect(() => {
    if (clip.frames <= 1) {
      if (!loop) onEndRef.current?.()
      return
    }

    let f = 0
    const id = setInterval(() => {
      f += 1
      if (f >= clip.frames) {
        if (loop) {
          f = 0
        } else {
          // Hold the last frame and report completion.
          setFrame(clip.frames - 1)
          clearInterval(id)
          onEndRef.current?.()
          return
        }
      }
      setFrame(f)
    }, 1000 / clip.fps)

    return () => clearInterval(id)
    // playToken forces a restart for repeated one-shots.
  }, [state, playToken, clip.frames, clip.fps, loop])

  // The sheet is scaled so one 64px cell (FRAME) becomes `size` px on screen,
  // and the full sheet is COLS x ROWS of those cells.
  const scale = size / FRAME
  // Drop the sprite by its transparent bottom padding so every state's feet
  // land on the same ground line (the bottom of the view).
  const dropY = clip.pad * scale
  return (
    <View
      style={[
        {width: size, height: size, overflow: 'hidden'},
        {
          transform:
            facing === -1
              ? [{translateY: dropY}, {scaleX: -1}]
              : [{translateY: dropY}],
        },
      ]}>
      <Image
        source={CAT_SHEETS[color]}
        accessibilityIgnoresInvertColors
        contentFit="fill"
        style={[
          a.absolute,
          {
            width: COLS * size,
            height: ROWS * size,
            left: -frame * size,
            top: -clip.row * size,
          },
          // Crisp pixel-art scaling on web; native ignores this.
          web({
            imageRendering: 'pixelated',
            // Stop mobile Safari from opening/saving the raw spritesheet on a
            // long press. Routing touches past the <img> to the Pressable also
            // kills the iOS image callout, so petting still works.
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }),
        ]}
      />
    </View>
  )
}
