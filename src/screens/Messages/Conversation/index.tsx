import React from 'react'
import {View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {useSession} from 'state/session'
import {ViewHeader} from '#/view/com/util/ViewHeader'
import {CenteredView} from 'view/com/util/Views'
import {MessagesList} from '#/screens/Messages/Conversation/MessagesList'
import {useChat, useChatQuery} from '#/screens/Messages/Temp/query/query'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DialogControlProps} from '#/components/Dialog'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '#/components/icons/Envelope'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSlider} from '#/components/icons/SettingsSlider'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {ClipClopGate} from '../gate'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>
export function MessagesConversationScreen({route}: Props) {
  const {_} = useLingui()
  const gate = useGate()

  const chatId = route.params.conversation

  const {currentAccount} = useSession()
  const myDid = currentAccount?.did

  const {
    data: chat,
    isLoading: isLoading,
    isError: isError,
  } = useChatQuery(chatId)

  const otherProfile = React.useMemo(() => {
    return chat?.members?.find(m => m.did !== myDid)
  }, [chat?.members, myDid])

  console.log(otherProfile)

  if (!gate('dms')) return <ClipClopGate />

  if (!chat || !otherProfile) {
    return (
      <CenteredView style={{flex: 1}} sideBorders>
        <ListMaybePlaceholder isLoading={true} isError={isError} />
      </CenteredView>
    )
  }

  return (
    <CenteredView style={{flex: 1}} sideBorders>
      <Header profile={otherProfile} />
      <MessagesList chatId={chatId} />
    </CenteredView>
  )
}

function Header({profile}: {profile: AppBskyActorDefs.ProfileViewBasic}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtTablet} = useBreakpoints()

  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_lg,
        a.px_lg,
        a.py_sm,
      ]}>
      <Text style={[a.text_2xl, a.font_bold]}>
        <Trans>Messages</Trans>
      </Text>
      <View style={[a.flex_row, a.align_center, a.gap_md]}>
        <Button
          label={_(msg`Message settings`)}
          color="secondary"
          size="large"
          variant="ghost"
          style={[{height: 'auto', width: 'auto'}, a.px_sm, a.py_sm]}
          onPress={() => {}}>
          <ButtonIcon icon={SettingsSlider} />
        </Button>
        {gtTablet && (
          <Button
            label={_(msg`New chat`)}
            color="primary"
            size="large"
            variant="solid"
            style={[{height: 'auto', width: 'auto'}, a.px_md, a.py_sm]}
            onPress={() => {}}>
            <ButtonIcon icon={Envelope} position="right" />
            <ButtonText>
              <Trans>New chat</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  )
}
