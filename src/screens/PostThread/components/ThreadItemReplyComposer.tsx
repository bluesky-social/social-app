import {View} from 'react-native'

import {OUTER_SPACE} from '#/screens/PostThread/const'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as Skele from '#/components/Skeleton'

/*
 * Wacky padding here is just replicating what we have in the actual
 * `PostThreadComposePrompt` component
 */
export function ThreadItemReplyComposerSkeleton() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  return (
    <View
      style={[
        a.border_t,
        t.atoms.border_contrast_low,
        gtMobile ? a.py_xs : {paddingTop: 8, paddingBottom: 11},
        {
          paddingHorizontal: OUTER_SPACE,
        },
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.py_sm]}>
        <Skele.Circle size={gtMobile ? 24 : 22} />
        <Skele.Text style={[a.text_md]} />
      </View>
    </View>
  )
}
