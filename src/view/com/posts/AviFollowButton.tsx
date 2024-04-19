import React, {useCallback} from 'react'
import {Alert, Pressable, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createHitslop} from '#/lib/constants'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'

export function AviFollowButton({
  author,
  children,
}: {
  author: AppBskyActorDefs.ProfileViewBasic
  children: React.ReactNode
}) {
  const {_} = useLingui()
  const t = useTheme()
  const profileShadow = useProfileShadow(author)
  const {follow} = useFollowMethods({
    profile: profileShadow,
    logContext: 'AvatarButton',
  })

  const name = profileShadow.displayName || profileShadow.handle

  const onPress = useCallback(() => {
    Alert.alert(_(msg`Follow ${name}`), undefined, [
      {
        text: _(msg`Cancel`),
        style: 'cancel',
      },
      {
        text: _(msg`Follow`),
        onPress: follow,
      },
    ])
  }, [follow, name, _])

  if (profileShadow.viewer?.following) {
    return children
  }

  return (
    <View style={a.relative}>
      {children}

      <Button label={_(msg`Follow ${name}`)}>
        {({pressed}) => (
          <Pressable
            accessibilityLabel={_(msg`Follow ${name}`)}
            accessibilityHint=""
            onPress={onPress}
            hitSlop={createHitslop(3)}
            style={[
              a.rounded_full,
              pressed ? t.atoms.bg_contrast_800 : t.atoms.bg_contrast_975,
              a.absolute,
              {
                bottom: -4,
                right: -2,
                borderWidth: 2,
                borderColor: t.atoms.bg.backgroundColor,
              },
            ]}>
            <Plus size="sm" fill={t.atoms.bg.backgroundColor} />
          </Pressable>
        )}
      </Button>
    </View>
  )
}
