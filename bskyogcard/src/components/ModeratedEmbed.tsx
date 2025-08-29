import {atoms as a, theme as t} from '../theme/index.js'
import {ModerationCauseInfo} from '../util/getModerationCauseInfo.js'
import {Box} from './Box.js'
import {Text} from './Text.js'

export function ModeratedEmbed({info}: {info: ModerationCauseInfo}) {
  return (
    <Box
      cx={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.rounded_sm,
        a.p_md,
        t.atoms.bg_contrast_25,
      ]}>
      <info.icon size={20} fill={t.atoms.text_contrast_low.color} />
      <Box cx={[a.gap_xs]}>
        <Text cx={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}>
          {info.name}
        </Text>
      </Box>
    </Box>
  )
}
