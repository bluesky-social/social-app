import React, {useCallback} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {KeyboardProvider} from 'react-native-keyboard-controller'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {BACK_HITSLOP} from 'lib/constants'
import {isWeb} from 'platform/detection'
import {ChatProvider, useChat} from 'state/messages'
import {ConvoStatus} from 'state/messages/convo'
import {PreviewableUserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {MessagesList} from '#/screens/Messages/Conversation/MessagesList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {ConvoMenu} from '#/components/dms/ConvoMenu'
import {ListMaybePlaceholder} from '#/components/Lists'
import {Text} from '#/components/Typography'
import {ClipClopGate} from '../gate'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'MessagesConversation'
>
export function MessagesConversationScreen({route}: Props) {
  const gate = useGate()
  const convoId = route.params.conversation

  if (!gate('dms')) return <ClipClopGate />

  return (
    <ChatProvider convoId={convoId}>
      <Inner />
    </ChatProvider>
  )
}

function Inner() {
  const chat = useChat()

  if (
    chat.status === ConvoStatus.Uninitialized ||
    chat.status === ConvoStatus.Initializing
  ) {
    return <ListMaybePlaceholder isLoading />
  }

  if (chat.status === ConvoStatus.Error) {
    // TODO error
    return null
  }

  /*
   * Any other chat states (atm) are "ready" states
   */

  return (
    <KeyboardProvider>
      <CenteredView style={{flex: 1}} sideBorders>
        <Header profile={chat.recipients[0]} />
        <MessagesList />
      </CenteredView>
    </KeyboardProvider>
  )
}

let Header = ({
  profile,
}: {
  profile: AppBskyActorDefs.ProfileViewBasic
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {gtTablet} = useBreakpoints()
  const navigation = useNavigation<NavigationProp>()
  const chat = useChat()

  const onPressBack = useCallback(() => {
    if (isWeb) {
      navigation.replace('Messages')
    } else {
      navigation.pop()
    }
  }, [navigation])

  const onUpdateConvo = useCallback(() => {
    // TODO eric update muted state
  }, [])

  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.justify_between,
        a.align_start,
        a.gap_lg,
        a.px_lg,
        a.py_sm,
      ]}>
      {!gtTablet ? (
        <TouchableOpacity
          testID="conversationHeaderBackBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={{width: 30, height: 30}}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint="">
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={{
              marginTop: 6,
            }}
            color={t.atoms.text.color}
          />
        </TouchableOpacity>
      ) : (
        <View style={{width: 30}} />
      )}
      <View style={[a.align_center, a.gap_sm, a.flex_1]}>
        <PreviewableUserAvatar size={32} profile={profile} />
        <Text style={[a.text_lg, a.font_bold, a.text_center]}>
          {profile.displayName}
        </Text>
      </View>
      {chat.status === ConvoStatus.Ready ? (
        <ConvoMenu
          convo={chat.convo}
          profile={profile}
          onUpdateConvo={onUpdateConvo}
          currentScreen="conversation"
        />
      ) : (
        <View style={{width: 30}} />
      )}
    </View>
  )
}
Header = React.memo(Header)
