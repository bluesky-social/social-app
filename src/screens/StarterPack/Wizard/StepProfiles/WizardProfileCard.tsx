import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useProfileQuery} from 'state/queries/profile'
import {useSession} from 'state/session'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'

export function WizardProfileCard() {
  const {_} = useLingui()
  const t = useTheme()

  // TODO remove this
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})

  return (
    <View style={[a.flex_row, a.align_center, a.px_md]}>
      <UserAvatar size={60} avatar={profile?.avatar} />
      <View style={[a.flex_1]}>
        <Text>{profile?.displayName || profile?.handle}</Text>
        {profile?.displayName && <Text>{profile?.handle}</Text>}
      </View>
      <Button label={_(msg`Add`)}>
        <ButtonText>
          <Trans>Add</Trans>
        </ButtonText>
      </Button>
    </View>
  )
}
