import {Image as ImageSource} from '../data/getPostData.js'
import {atoms as a, style as s, theme as t} from '../theme/index.js'
import {toNiceDomain} from '../util/toNiceDomain.js'
import {Box} from './Box.js'
import {Globe} from './Globe.js'
import {Image} from './Image.js'
import {Text} from './Text.js'

export function LinkCard({
  image,
  uri,
  title,
  description,
}: {
  image?: ImageSource
  uri: string
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
      <Box cx={[a.px_md, a.pt_md, t.atoms.bg]}>
        <Text cx={[a.text_md, a.font_bold, a.pb_xs, a.line_clamp_3]}>
          {title}
        </Text>
        <Text
          cx={[
            a.text_sm,
            a.leading_snug,
            a.pb_sm,
            image ? a.line_clamp_2 : a.line_clamp_4,
          ]}>
          {description}
        </Text>
        <Box
          cx={[
            a.border_t,
            t.atoms.border_contrast_low,
            a.flex_row,
            a.align_center,
            {paddingTop: 6},
            a.pb_sm,
            a.gap_2xs,
          ]}>
          <Globe height={12} width={12} style={t.atoms.text_contrast_medium} />
          <Text
            cx={[
              a.text_xs,
              a.pb_sm,
              t.atoms.text_contrast_medium,
              a.max_w_full,
              // I don't know why, but the text element is too tall. manually set the height
              {overflowX: 'hidden', height: 14},
              a.line_clamp_1,
            ]}>
            {toNiceDomain(uri)}
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
