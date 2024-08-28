/* eslint-disable react-native-a11y/has-valid-accessibility-ignores-invert-colors */
import React from 'react'

import {atoms as a, theme as t} from '../theme/index.js'
import {Image as ImageSource} from '../util/resolvePostData.js'
import {toShortUrl} from '../util/toShortUrl.js'
import {Box} from './Box.js'
import {Image} from './Image.js'
import {Text} from './Text.js'

export function LinkCard({
  image,
  uri,
  title,
  description,
}: {
  image?: ImageSource
  uri?: string
  title: string
  description: string
}) {
  return (
    <Box
      cx={[
        a.w_full,
        a.rounded_sm,
        a.overflow_hidden,
        a.border,
        t.atoms.border_contrast_low,
      ]}>
      {image && (
        <Box
          cx={[
            a.relative,
            a.w_full,
            t.atoms.bg_contrast_25,
            {paddingTop: (630 / 1200) * 100 + '%'},
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
      )}
      <Box cx={[a.p_md, t.atoms.bg]}>
        {uri && (
          <Text cx={[a.text_xs, a.pb_sm, t.atoms.text_contrast_medium]}>
            {toShortUrl(uri)}
          </Text>
        )}
        <Text cx={[a.text_md, a.font_bold, a.pb_xs]}>{title}</Text>
        <Text cx={[a.text_sm, a.leading_snug]}>{description}</Text>
      </Box>
    </Box>
  )
}
