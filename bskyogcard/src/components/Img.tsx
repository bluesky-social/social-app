import React from 'react'

export function Img(
  props: Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {src: Buffer},
) {
  const {src, ...others} = props
  return (
    <img {...others} src={`data:image/jpeg;base64,${src.toString('base64')}`} />
  )
}
