import React from 'react'
import {Pressable, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createHitslop} from '#/lib/constants'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {atoms as a, useTheme} from '#/alf'
import {useFollowMethods} from '#/components/hooks/useFollowMethods'
import {PersonPlus_Stroke2_Corner0_Rounded as PersonPlus} from '#/components/icons/Person'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import * as Menu from '#/components/Menu'

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

  if (profileShadow.viewer?.following) {
    return children
  }

  const name = profileShadow.displayName || profileShadow.handle

  return (
    <View style={a.relative}>
      {children}

      <Menu.Root>
        <Menu.Trigger label={_(msg`Follow ${name}`)}>
          {({props, state: {pressed}}) => (
            <Pressable
              {...props}
              hitSlop={createHitslop(3)}
              style={[
                a.rounded_full,
                a.absolute,
                {
                  bottom: -4,
                  right: -4,
                  backgroundColor: pressed
                    ? t.palette.primary_400
                    : t.palette.primary_500,
                  borderWidth: 2,
                  borderColor: t.palette.white,
                },
              ]}>
              <Plus size="md" fill={t.palette.white} />
            </Pressable>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Item label={_(msg`Follow ${name}`)} onPress={follow}>
            <Menu.ItemText>
              <Trans>Follow {name}</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={PersonPlus} />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </View>
  )
}
