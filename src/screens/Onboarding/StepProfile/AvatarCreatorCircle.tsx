import React from 'react'
import {View} from 'react-native'

import {Avatar} from '#/screens/Onboarding/StepProfile/index'
import {atoms as a, native, useTheme, web} from '#/alf'

export function AvatarCreatorCircle({
  avatar,
  size = 125,
}: {
  avatar: Avatar
  size?: number
}) {
  const t = useTheme()
  const Icon = avatar.placeholder.component

  const styles = React.useMemo(
    () => ({
      imageContainer: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        t.atoms.border_contrast_high,
        {
          height: size,
          width: size,
          backgroundColor: avatar.backgroundColor,
        },
        web({borderWidth: 2}),
        native({borderWidth: 1}),
      ],
    }),
    [avatar.backgroundColor, size, t.atoms.border_contrast_high],
  )

  return (
    <View>
      <View style={styles.imageContainer}>
        <Icon height={85} width={85} style={{color: t.palette.white}} />
      </View>
    </View>
  )
}
