import React, {useCallback} from 'react'
import {Pressable} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {useChat} from '#/state/messages'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeft} from '#/components/icons/ArrowBoxLeft'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {PersonCheck_Stroke2_Corner0_Rounded as PersonCheck} from '#/components/icons/PersonCheck'
import {PersonX_Stroke2_Corner0_Rounded as PersonX} from '#/components/icons/PersonX'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import * as Menu from '#/components/Menu'

let ConvoMenu = ({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
}): React.ReactNode => {
  const {convoId} = useChat()
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()

  const onNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile', {name: profile.did})
  }, [navigation, profile.did])

  const {mutate: leaveConvo} = useLeaveConvo(convoId, {
    onSuccess: () => {
      navigation.popToTop()
    },
    onError: () => {
      Toast.show('Could not leave chat')
    },
  })

  return (
    <Menu.Root>
      <Menu.Trigger label={_(msg`Chat settings`)}>
        {({props, state}) => (
          <Pressable
            {...props}
            style={[
              a.p_sm,
              a.rounded_sm,
              (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
            ]}>
            <DotsHorizontal size="lg" style={t.atoms.text} />
          </Pressable>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Go to user's profile`)}
            onPress={onNavigateToProfile}>
            <Menu.ItemText>
              <Trans>Go to profile</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={Person} />
          </Menu.Item>
          <Menu.Item label={_(msg`Mute conversation`)} onPress={() => {}}>
            <Menu.ItemText>
              <Trans>Mute conversation</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={profile.viewer?.muted ? Unmute : Mute} />
          </Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item label={_(msg`Block account`)} onPress={() => {}}>
            <Menu.ItemText>
              <Trans>Block account</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon
              icon={profile.viewer?.blocking ? PersonCheck : PersonX}
            />
          </Menu.Item>
          <Menu.Item label={_(msg`Report account`)} onPress={() => {}}>
            <Menu.ItemText>
              <Trans>Report account</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={Flag} />
          </Menu.Item>
        </Menu.Group>
        <Menu.Group>
          <Menu.Item
            label={_(msg`Leave conversation`)}
            onPress={() => leaveConvo()}>
            <Menu.ItemText>
              <Trans>Leave conversation</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={ArrowBoxLeft} />
          </Menu.Item>
        </Menu.Group>
      </Menu.Outer>
    </Menu.Root>
  )
}
ConvoMenu = React.memo(ConvoMenu)

export {ConvoMenu}
