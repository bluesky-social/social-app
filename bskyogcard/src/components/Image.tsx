import React from 'react'

import {Image as ImageSource} from '../data/getPostData.js'
import {atoms as a, style as s, theme as t} from '../theme/index.js'
import {Box} from './Box.js'

export type ImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'style'
> & {
  image: ImageSource
  cx?: Record<string, any>[]
}

export function Image({image, cx, ...rest}: ImageProps) {
  const {image: src, mime = 'image/jpeg'} = image
  return (
    <img
      {...rest}
      src={`data:${mime};base64,${src.toString('base64')}`}
      style={cx ? s(cx) : undefined}
    />
  )
}

export function SquareImage({image}: {image: ImageSource}) {
  return (
    <Box
      cx={[
        a.relative,
        a.rounded_sm,
        a.overflow_hidden,
        a.w_full,
        t.atoms.bg_contrast_25,
        {paddingTop: '100%'},
      ]}>
      <Image
        image={image}
        cx={[
          a.absolute,
          a.inset_0,
          {
            objectFit: 'cover',
          },
        ]}
      />
    </Box>
  )
}
