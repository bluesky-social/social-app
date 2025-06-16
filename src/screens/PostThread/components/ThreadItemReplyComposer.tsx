import {View} from 'react-native'

import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Skele from '#/components/Skeleton'

export function ThreadItemReplyComposerSkeleton() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  if (!gtMobile) return null

  return (
    <View style={[a.px_sm, a.py_xs, a.border_t, t.atoms.border_contrast_low]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.px_sm, a.py_sm]}>
        <Skele.Circle size={24} />
        <Skele.Text style={[a.text_md, {maxWidth: 119}]} />
      </View>
    </View>
  )
}
