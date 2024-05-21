import React from 'react'
import {View} from 'react-native'
import {Image as ExpoImage} from 'expo-image'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {AvatarCreatorCircle} from '#/screens/Onboarding/StepProfile/AvatarCreatorCircle'
import {useAvatar} from '#/screens/Onboarding/StepProfile/index'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Pencil_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import {StreamingLive_Stroke2_Corner0_Rounded as StreamingLive} from '#/components/icons/StreamingLive'

export function AvatarCircle({
  openLibrary,
  openCreator,
}: {
  openLibrary: () => unknown
  openCreator: () => unknown
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {avatar} = useAvatar()

  const styles = React.useMemo(
    () => ({
      imageContainer: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
        {
          height: 200,
          width: 200,
        },
      ],
    }),
    [t.atoms.bg_contrast_25, t.atoms.border_contrast_low],
  )

  return (
    <View>
      {avatar.useCreatedAvatar ? (
        <AvatarCreatorCircle avatar={avatar} size={200} />
      ) : avatar.image ? (
        <ExpoImage
          source={avatar.image.path}
          style={styles.imageContainer}
          accessibilityIgnoresInvertColors
          transition={{duration: 300, effect: 'cross-dissolve'}}
        />
      ) : (
        <View style={styles.imageContainer}>
          <StreamingLive
            height={100}
            width={100}
            style={{color: t.palette.contrast_200}}
          />
        </View>
      )}
      <View style={[a.absolute, {bottom: 2, right: 2}]}>
        <Button
          label={_(msg`Select an avatar`)}
          size="large"
          shape="round"
          variant="solid"
          color="primary"
          onPress={avatar.useCreatedAvatar ? openCreator : openLibrary}>
          <ButtonIcon icon={Pencil} />
        </Button>
      </View>
    </View>
  )
}
