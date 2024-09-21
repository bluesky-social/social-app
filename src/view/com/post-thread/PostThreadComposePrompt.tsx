import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ScaleOnPressIn} from '#/lib/custom-animations/ScaleOnPressIn'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

export function PostThreadComposePrompt({
  onPressCompose,
}: {
  onPressCompose: () => void
}) {
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const {_} = useLingui()
  const {isTabletOrDesktop} = useWebMediaQueries()
  const t = useTheme()

  return (
    <ScaleOnPressIn
      accessibilityRole="button"
      accessibilityLabel={_(msg`Compose reply`)}
      accessibilityHint={_(msg`Opens composer`)}
      targetScale={isTabletOrDesktop ? 1 : 0.975}
      style={[
        {paddingTop: 8, paddingBottom: isTabletOrDesktop ? 8 : 11},
        a.px_sm,
        a.border_t,
        t.atoms.border_contrast_low,
        t.atoms.bg,
      ]}
      onPress={onPressCompose}>
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.p_sm,
          a.gap_sm,
          a.rounded_full,
          t.atoms.bg_contrast_25,
        ]}>
        <UserAvatar
          size={22}
          avatar={profile?.avatar}
          type={profile?.associated?.labeler ? 'labeler' : 'user'}
        />
        <Text
          style={[
            isTabletOrDesktop ? a.text_md : a.text_sm,
            t.atoms.text_contrast_medium,
          ]}>
          <Trans>Write your reply</Trans>
        </Text>
      </View>
    </ScaleOnPressIn>
  )
}
