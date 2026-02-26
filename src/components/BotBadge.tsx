import {View} from 'react-native'
import {type ComAtprotoLabelDefs} from '@atproto/api'

import {isBotAccount} from '#/lib/bots'
import {atoms as a, useTheme} from '#/alf'
import {Robot_Stroke2_Corner2_Rounded as RobotIcon} from '#/components/icons/Robot'

export function BotBadge({
  profile,
  size = 12,
}: {
  profile: {did: string; labels?: ComAtprotoLabelDefs.Label[]}
  size?: number
}) {
  const t = useTheme()

  if (!isBotAccount(profile)) {
    return null
  }

  return (
    <View style={[a.pl_2xs, a.self_center]}>
      <RobotIcon width={size} fill={t.atoms.text_contrast_medium.color} />
    </View>
  )
}
