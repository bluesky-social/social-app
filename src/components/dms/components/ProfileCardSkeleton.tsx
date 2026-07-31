import {View} from 'react-native'

import {atoms as a} from '#/alf'
import * as ProfileCard from '#/components/ProfileCard'

export function ProfileCardSkeleton() {
  return (
    <View
      style={[
        a.flex_1,
        a.py_md,
        a.px_lg,
        a.gap_md,
        a.align_center,
        a.flex_row,
      ]}>
      <ProfileCard.AvatarPlaceholder size={42} />
      <ProfileCard.NameAndHandlePlaceholder />
    </View>
  )
}
