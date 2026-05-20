/*
 * This is a reimplementation of what exists in our HTML template files
 * already. Once the React tree mounts, this is what gets rendered first, until
 * the app is ready to go.
 */

import {useEffect, useRef, useState} from 'react'
import Svg, {Path, SvgXml} from 'react-native-svg'

import {atoms as a, flatten} from '#/alf'
import {getActiveBrand} from '#/brand/activeBrand'

const size = 100

export function Splash({
  isReady,
  children,
}: React.PropsWithChildren<{
  isReady: boolean
}>) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const splashRef = useRef<HTMLDivElement>(null)

  const brand = getActiveBrand()
  const {mark} = brand.logo
  const ratio = mark.ratio || 1

  // hide the static one that's baked into the HTML - gets replaced by our React version below
  useEffect(() => {
    // double rAF ensures that the React version gets painted first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const splash = document.getElementById('splash')
        if (splash) {
          splash.remove()
        }
      })
    })
  }, [])

  // when ready, we fade/scale out
  useEffect(() => {
    if (!isReady) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const node = splashRef.current
    if (!node || reduceMotion) {
      setIsAnimationComplete(true)
      return
    }

    const animation = node.animate(
      [
        {opacity: 1, transform: 'scale(1)'},
        {opacity: 0, transform: 'scale(1.5)'},
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards',
      },
    )
    animation.onfinish = () => setIsAnimationComplete(true)

    return () => {
      animation.cancel()
    }
  }, [isReady])

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const brandPrimary = brand.primaryColor
  const color = prefersDark ? '#FFFFFF' : brandPrimary || '#000000'

  return (
    <>
      {isReady && children}

      {!isAnimationComplete && (
        <div
          ref={splashRef}
          style={flatten([
            a.fixed,
            a.inset_0,
            a.flex,
            a.align_center,
            a.justify_center,
            // to compensate for the `top: -50px` below
            {transformOrigin: 'center calc(50% - 50px)'},
          ])}>
          {'xml' in mark ? (
            <div
              style={{
                width: size,
                height: size * ratio,
                position: 'relative',
                top: -50,
                color,
              }}>
              <SvgXml xml={mark.xml} width="100%" height="100%" />
            </div>
          ) : (
            <div
              style={{
                width: size,
                height: size * ratio,
                position: 'relative',
                top: -50,
                color,
              }}>
              <Svg
                fill="none"
                viewBox={mark.viewBox || '0 0 24 24'}
                style={[a.relative, {width: '100%', height: '100%'}]}>
                <Path fill="currentColor" d={mark.path} />
              </Svg>
            </div>
          )}
        </div>
      )}
    </>
  )
}
