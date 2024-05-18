import React, {useCallback} from 'react'
import {AppBskyActorDefs} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {useMaybeConvoForUser} from '#/state/queries/messages/get-convo-for-members'
import {useTheme} from '#/alf'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {Button} from '../Button'

export function MessageProfileButton({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileView
}) {
  const navigation = useNavigation<NavigationProp>()
  const {_} = useLingui()
  const t = useTheme()

  const {data: convoId} = useMaybeConvoForUser(profile.did)

  const onPressDm = useCallback(() => {
    if (!convoId) return
    navigation.navigate('MessagesConversation', {conversation: convoId})
  }, [navigation, convoId])

  if (!convoId) return null

  return (
    <Button
      testID="dmBtn"
      size="small"
      color="secondary"
      variant="solid"
      shape="round"
      onPress={onPressDm}
      label={_(msg`Message ${profile.handle}`)}
      style={{width: 36, height: 36}}>
      <Envelope style={t.atoms.text} size="md" />
    </Button>
  )
}
