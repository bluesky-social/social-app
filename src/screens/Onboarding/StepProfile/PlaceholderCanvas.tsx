import React from 'react'
import {View} from 'react-native'
import type ViewShot from 'react-native-view-shot'

import {useAvatar} from '#/screens/Onboarding/StepProfile/index'
import {atoms as a} from '#/alf'

const LazyViewShot = React.lazy(
  // @ts-expect-error dynamic import
  () => import('react-native-view-shot/src/index'),
)

const SIZE_MULTIPLIER = 5

export interface PlaceholderCanvasRef {
  capture: () => Promise<string | undefined>
}

// This component is supposed to be invisible to the user. We only need this for ViewShot to have something to
// "screenshot".
export const PlaceholderCanvas = React.forwardRef<PlaceholderCanvasRef, {}>(
  function PlaceholderCanvas({}, ref) {
    const {avatar} = useAvatar()
    const viewshotRef = React.useRef<ViewShot>(null)
    const Icon = avatar.placeholder.component

    const styles = React.useMemo(
      () => ({
        container: [a.absolute, {top: -2000}],
        imageContainer: [
          a.align_center,
          a.justify_center,
          {height: 150 * SIZE_MULTIPLIER, width: 150 * SIZE_MULTIPLIER},
        ],
      }),
      [],
    )

    React.useImperativeHandle(ref, () => ({
      capture: async () => {
        if (viewshotRef.current?.capture) {
          return await viewshotRef.current.capture()
        }
      },
    }))

    return (
      <View style={styles.container}>
        <React.Suspense fallback={null}>
          <LazyViewShot
            // @ts-ignore this library doesn't have types
            ref={viewshotRef}
            options={{
              fileName: 'placeholderAvatar',
              format: 'jpg',
              quality: 0.8,
              height: 150 * SIZE_MULTIPLIER,
              width: 150 * SIZE_MULTIPLIER,
            }}>
            <View
              style={[
                styles.imageContainer,
                {backgroundColor: avatar.backgroundColor},
              ]}
              collapsable={false}>
              <Icon
                height={85 * SIZE_MULTIPLIER}
                width={85 * SIZE_MULTIPLIER}
                style={{color: 'white'}}
              />
            </View>
          </LazyViewShot>
        </React.Suspense>
      </View>
    )
  },
)
