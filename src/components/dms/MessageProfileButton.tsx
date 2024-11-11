import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useEmail} from '#/lib/hooks/useEmail'
import {NavigationProp} from '#/lib/routes/types'
import {logEvent} from '#/lib/statsig/statsig'
import {useMaybeConvoForUser} from '#/state/queries/messages/get-convo-for-members'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {canBeMessaged} from '#/components/dms/util'
import {Message_Stroke2_Corner0_Rounded as Message} from '#/components/icons/Message'
import {useDialogControl} from '../Dialog'
import {VerifyEmailDialog} from '../dialogs/VerifyEmailDialog'

export function MessageProfileButton({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileView
}) {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const {needsEmailVerification} = useEmail()
  const verifyEmailControl = useDialogControl()

  const {data: convo, isPending} = useMaybeConvoForUser(profile.did)

  const onPress = React.useCallback(() => {
    if (!convo?.id) {
      return
    }

    if (needsEmailVerification) {
      verifyEmailControl.open()
      return
    }

    if (convo && !convo.lastMessage) {
      logEvent('chat:create', {logContext: 'ProfileHeader'})
    }
    logEvent('chat:open', {logContext: 'ProfileHeader'})

    navigation.navigate('MessagesConversation', {conversation: convo.id})
  }, [needsEmailVerification, verifyEmailControl, convo, navigation])

  if (isPending) {
    // show pending state based on declaration
    if (canBeMessaged(profile)) {
      return (
        <View
          testID="dmBtnLoading"
          aria-hidden={true}
          style={[
            a.justify_center,
            a.align_center,
            t.atoms.bg_contrast_25,
            a.rounded_full,
            {width: 34, height: 34},
          ]}>
          <Message style={[t.atoms.text, {opacity: 0.3}]} size="md" />
        </View>
      )
    } else {
      return null
    }
  }

  if (convo) {
    return (
      <>
        <Button
          accessibilityRole="button"
          testID="dmBtn"
          size="small"
          color="secondary"
          variant="solid"
          shape="round"
          label={_(msg`Message ${profile.handle}`)}
          style={[a.justify_center]}
          onPress={onPress}>
          <ButtonIcon icon={Message} size="md" />
        </Button>
        <VerifyEmailDialog
          reasonText={_(
            msg`Before you may message another user, you must first verify your email.`,
          )}
          control={verifyEmailControl}
        />
      </>
    )
  } else {
    return null
  }
}
