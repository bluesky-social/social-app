import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs, ModerationDecision} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {createHitslop} from '#/lib/constants'
import {NavigationProp} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useSession} from '#/state/session'
import {
  DropdownItem,
  NativeDropdown,
} from '#/view/com/util/forms/NativeDropdown'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'

export function AviFollowButton({
  author,
  moderation,
  children,
}: {
  author: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision
  children: React.ReactNode
}) {
  const {_} = useLingui()
  const t = useTheme()
  const profile = useProfileShadow(author)
  const {follow} = useFollowMethods({
    profile: profile,
    logContext: 'AvatarButton',
  })
  const gate = useGate()
  const {currentAccount, hasSession} = useSession()
  const navigation = useNavigation<NavigationProp>()

  const name = sanitizeDisplayName(
    profile.displayName || profile.handle,
    moderation.ui('displayName'),
  )
  const isFollowing =
    profile.viewer?.following || profile.did === currentAccount?.did

  function onPress() {
    follow()
    Toast.show(_(msg`Following ${name}`))
  }

  const items: DropdownItem[] = [
    {
      label: _(msg`View profile`),
      onPress: () => {
        navigation.navigate('Profile', {name: profile.did})
      },
      icon: {
        ios: {
          name: 'arrow.up.right.square',
        },
        android: '',
        web: ['far', 'arrow-up-right-from-square'],
      },
    },
    {
      label: _(msg`Follow ${name}`),
      onPress: onPress,
      icon: {
        ios: {
          name: 'person.badge.plus',
        },
        android: '',
        web: ['far', 'user-plus'],
      },
    },
  ]

  return hasSession && gate('show_avi_follow_button') ? (
    <View style={a.relative}>
      {children}

      {!isFollowing && (
        <Button
          label={_(msg`Open ${name} profile shortcut menu`)}
          hitSlop={createHitslop(3)}
          style={[
            a.rounded_full,
            t.atoms.bg_contrast_975,
            a.absolute,
            {
              bottom: -2,
              right: -2,
              borderWidth: 1,
              borderColor: t.atoms.bg.backgroundColor,
            },
          ]}>
          <NativeDropdown items={items}>
            <Plus size="sm" fill={t.atoms.bg.backgroundColor} />
          </NativeDropdown>
        </Button>
      )}
    </View>
  ) : (
    children
  )
}
