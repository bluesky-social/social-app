import React from 'react'

function detectMime(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png'
  if (buf[0] === 0x52 && buf[1] === 0x49) return 'image/webp'
  if (buf[0] === 0x47 && buf[1] === 0x49) return 'image/gif'
  return 'image/jpeg'
}

export function Img(
  props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {src: Buffer},
) {
  const {src, ...others} = props
  return (
    <img
      {...others}
      src={`data:${detectMime(src)};base64,${src.toString('base64')}`}
    />
  )
}
