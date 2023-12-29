import React from 'react'
import {StyleSheet, View} from 'react-native'

export function WebGifStill({
  source,
  imageDims,
}: {
  source: string
  imageDims: {height: number; width: number}
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    // Create a new image and draw it to the canvas. This draws only the first frame of the gif or webp
    const img = new Image()
    img.onload = () => {
      canvasRef.current
        ?.getContext('2d')
        ?.drawImage(img, 0, 0, imageDims.width, imageDims.height)
    }
    img.src = source
    console.log(imageDims)
  }, [source, imageDims])

  return (
    <View style={[styles.container]}>
      <canvas
        ref={canvasRef}
        height={imageDims.height}
        width={imageDims.width}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
