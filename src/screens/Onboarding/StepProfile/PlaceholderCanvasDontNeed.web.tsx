import React from 'react'
import {useAvatar} from '#/screens/Onboarding/StepProfile/index'
import {StyleSheet, View} from 'react-native'

const CANVAS_HEIGHT = 24 * 20
const CANVAS_OFFSET = 24 * 3

export interface PlaceholderCanvasRef {
  capture: () => string
}

export const PlaceholderCanvas = React.forwardRef(function PlaceholderCanvas(
  {},
  ref,
) {
  const avatar = useAvatar()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const capture = React.useCallback(() => {
    return canvasRef.current?.toDataURL('image/jpeg')
  }, [])

  React.useImperativeHandle(ref, () => ({
    capture,
  }))

  React.useEffect(() => {
    // @ts-ignore web only
    const path = new Path2D(avatar.placeholder.path)
    // @ts-ignore web only
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.reset()
    ctx.fillStyle = avatar.backgroundColor
    ctx?.moveTo(0, 0)
    ctx?.fillRect(0, 0, CANVAS_HEIGHT, CANVAS_HEIGHT)
    ctx.fillStyle = '#fff'
    ctx.lineWidth = 0.1
    ctx?.translate(CANVAS_OFFSET, CANVAS_OFFSET)
    ctx?.scale(14, 14)
    ctx?.fill(path)
  }, [avatar.backgroundColor, avatar.placeholder.path])

  return (
    <View style={styles.container}>
      <canvas ref={canvasRef} height={CANVAS_HEIGHT} width={CANVAS_HEIGHT} />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    top: -2000,
    position: 'absolute',
  },
})
