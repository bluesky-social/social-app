import React from 'react'
import {useAvatar} from '#/screens/Onboarding/StepProfile/index'

const CANVAS_HEIGHT = 24 * 10
const CANVAS_OFFSET = 24 * 1.5

interface PlaceholderCanvasRef {
  capture: () => string
}

export const PlaceholderCanvas = React.forwardRef(function PlaceholderCanvas(
  {},
  ref,
) {
  const avatar = useAvatar()
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  const capture = React.useCallback(() => {
    return ''
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
    ctx?.scale(7, 7)
    ctx?.fill(path)
  }, [avatar.backgroundColor, avatar.placeholder.path])

  return <canvas ref={canvasRef} height={CANVAS_HEIGHT} width={CANVAS_HEIGHT} />
})
