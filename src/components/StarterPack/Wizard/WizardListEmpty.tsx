import React from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/macro'

import {atoms as a, useTheme} from '#/alf'
import {Hashtag_Stroke2_Corner0_Rounded as Hashtag} from '#/components/icons/Hashtag'
import {UserCircle_Stroke2_Corner0_Rounded as UserCircle} from '#/components/icons/UserCircle'
import {Text} from '#/components/Typography'

export function WizardListEmpty({type}: {type: 'profiles' | 'feeds'}) {
  const t = useTheme()

  return (
    <View
      style={[a.flex_1, a.px_md, a.align_center, a.gap_md, {marginTop: 100}]}>
      {type === 'profiles' ? (
        <UserCircle
          width={100}
          height={100}
          style={t.atoms.text_contrast_medium}
        />
      ) : (
        <Hashtag
          width={100}
          height={100}
          style={t.atoms.text_contrast_medium}
        />
      )}
      <Text style={[a.text_md, a.text_center, t.atoms.text_contrast_medium]}>
        {type === 'profiles' ? (
          <Trans>
            Add people to your starter pack that you think others will enjoy
            following
          </Trans>
        ) : (
          <Trans>Add some cool feeds!</Trans>
        )}
      </Text>
    </View>
  )
}
