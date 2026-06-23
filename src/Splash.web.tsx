/*
 * This is a reimplementation of what exists in our HTML template files
 * already. Once the React tree mounts, this is what gets rendered first, until
 * the app is ready to go.
 */

import {useEffect, useRef, useState} from 'react'
import Svg, {Path} from 'react-native-svg'

import {atoms as a, flatten} from '#/alf'
import brandColors from '#/config/brand-colors.json'
import {BRAND_LOGO, BRAND_LOGO_3D} from '#/config/brand-logo'

const size = 100
const ratio = (BRAND_LOGO_3D ?? BRAND_LOGO).ratio
// Pre-boot splash: derive fills from the default accent (same source the HTML
// codegen uses) so the React handoff matches the static #splash mark exactly.
const accent =
  brandColors.accents[
    brandColors.defaultAccent as keyof typeof brandColors.accents
  ]

export function Splash({
  isReady,
  children,
}: React.PropsWithChildren<{
  isReady: boolean
}>) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const splashRef = useRef<HTMLDivElement>(null)

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
          <Svg
            fill="none"
            viewBox={(BRAND_LOGO_3D ?? BRAND_LOGO).viewBox}
            style={[a.relative, {width: size, height: size * ratio, top: -50}]}>
            {/* Brand wordmark - matches the pre-JS #splash mark in
                web/index.html so the handoff is seamless. 3D when the brand
                ships it, else the flat wordmark in the accent colour. */}
            {BRAND_LOGO_3D ? (
              <>
                <Path fill={accent.primary_900} d={BRAND_LOGO_3D.shadowPath} />
                <Path fill={accent.primary_400} d={BRAND_LOGO_3D.facePath} />
              </>
            ) : (
              <Path fill={accent.primary_500} d={BRAND_LOGO.path} />
            )}
          </Svg>
        </div>
      )}
    </>
  )
}
