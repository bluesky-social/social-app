import React from 'react'
import {View} from 'react-native'
import ViewShot from 'react-native-view-shot'

import {useAvatar} from '#/screens/Onboarding/StepProfile/index'
import {atoms as a} from '#/alf'

const SIZE_MULTIPLIER = 5

export interface PlaceholderCanvasRef {
  capture: () => Promise<string>
}

// This component is supposed to be invisible to the user. We only need this for ViewShot to have something to
// "screenshot".
export const PlaceholderCanvas = React.forwardRef<PlaceholderCanvasRef, {}>(
  function PlaceholderCanvas({}, ref) {
    const {avatar} = useAvatar()
    const viewshotRef = React.useRef()
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
      // @ts-ignore this library doesn't have types
      capture: viewshotRef.current.capture,
    }))

    return (
      <View style={styles.container}>
        <ViewShot
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
        </ViewShot>
      </View>
    )
  },
)
