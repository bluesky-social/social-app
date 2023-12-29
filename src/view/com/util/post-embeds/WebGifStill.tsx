import React from 'react'

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
  }, [source, imageDims])

  return (
    <canvas ref={canvasRef} height={imageDims.height} width={imageDims.width} />
  )
}
