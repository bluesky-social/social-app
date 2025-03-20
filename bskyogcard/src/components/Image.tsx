import React from 'react'

import {Image as ImageSource} from '../data/getPostData.js'
import {atoms as a, style as s, StyleProp, theme as t} from '../theme/index.js'
import {Box} from './Box.js'
import {MediaInsetBorder} from './MediaInsetBorder.js'

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

export function SquareImage({
  image,
  style,
  insetBorderStyle,
}: {
  image: ImageSource
  insetBorderStyle?: StyleProp['style']
} & StyleProp) {
  return (
    <Box
      cx={[
        a.relative,
        a.rounded_md,
        a.overflow_hidden,
        a.w_full,
        t.atoms.bg_contrast_25,
        {paddingTop: '100%'},
        style,
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
      <MediaInsetBorder style={insetBorderStyle} />
    </Box>
  )
}
