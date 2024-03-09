import React from 'react'
import {atoms as a, native, useTheme, web} from '#/alf'
import {useAvatar} from '#/screens/Onboarding/StepProfile/index'
import {TouchableOpacity, TouchableOpacityProps, View} from 'react-native'
import {Pencil_Stroke2_Corner0_Rounded as Pencil} from '#/components/icons/Pencil'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Image as ExpoImage} from 'expo-image'
import {AvatarCreatorCircle} from '#/screens/Onboarding/StepProfile/AvatarCreatorCircle'

function AvatarBottomButton({...props}: TouchableOpacityProps) {
  const t = useTheme()

  return (
    <TouchableOpacity
      {...props}
      style={[
        a.absolute,
        a.rounded_full,
        a.align_center,
        a.justify_center,
        {backgroundColor: t.palette.primary_500},
        {height: 48, width: 48, bottom: 2, right: 2},
      ]}>
      {props.children}
    </TouchableOpacity>
  )
}

export function AvatarCircle({
  openLibrary,
  openCreator,
}: {
  openLibrary: () => unknown
  openCreator: () => unknown
}) {
  const t = useTheme()
  const {avatar} = useAvatar()

  const styles = React.useMemo(
    () => ({
      imageContainer: [
        a.rounded_full,
        a.overflow_hidden,
        a.align_center,
        a.justify_center,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
        {
          height: 200,
          width: 200,
        },
        web({borderWidth: 2}),
        native({borderWidth: 1}),
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
          <ImageIcon
            height={100}
            width={100}
            style={{color: t.palette.contrast_200}}
          />
        </View>
      )}
      <AvatarBottomButton
        onPress={avatar.useCreatedAvatar ? openCreator : openLibrary}>
        <Pencil size="md" style={{color: t.palette.white}} />
      </AvatarBottomButton>
    </View>
  )
}
