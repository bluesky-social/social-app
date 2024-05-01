import React from 'react'
import {TouchableOpacity, View} from 'react-native'
import {AppBskyActorDefs} from '@atproto/api'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'

import {CommonNavigatorParams, NavigationProp} from '#/lib/routes/types'
import {useGate} from '#/lib/statsig/statsig'
import {BACK_HITSLOP} from 'lib/constants'
import {isWeb} from 'platform/detection'
import {ChatProvider, useChat} from 'state/messages'
import {ConvoStatus} from 'state/messages/convo'
import {useSession} from 'state/session'
import {UserAvatar} from 'view/com/util/UserAvatar'
import {CenteredView} from 'view/com/util/Views'
import {MessagesList} from '#/screens/Messages/Conversation/MessagesList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded} from '#/components/icons/DotGrid'
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
  const {currentAccount} = useSession()
  const myDid = currentAccount?.did

  const otherProfile = React.useMemo(() => {
    if (chat.state.status !== ConvoStatus.Ready) return
    return chat.state.convo.members.find(m => m.did !== myDid)
  }, [chat.state, myDid])

  // TODO whenever we have error messages, we should use them in here -hailey
  if (chat.state.status !== ConvoStatus.Ready || !otherProfile) {
    return (
      <ListMaybePlaceholder
        isLoading={true}
        isError={chat.state.status === ConvoStatus.Error}
      />
    )
  }

  return (
    <CenteredView style={{flex: 1}} sideBorders>
      <Header profile={otherProfile} />
      <MessagesList />
    </CenteredView>
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

  const onPressBack = React.useCallback(() => {
    if (isWeb) {
      navigation.replace('MessagesList')
    } else {
      navigation.pop()
    }
  }, [navigation])

  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_low,
        a.border_b,
        a.flex_row,
        a.justify_between,
        a.gap_lg,
        a.px_lg,
        a.py_sm,
      ]}>
      {!gtTablet ? (
        <TouchableOpacity
          testID="viewHeaderDrawerBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={{
            width: 30,
            height: 30,
          }}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Back`)}
          accessibilityHint={_(msg`Access navigation links and settings`)}>
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
      <View style={[a.align_center, a.gap_sm]}>
        <UserAvatar size={32} avatar={profile.avatar} />
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>{profile.displayName}</Trans>
        </Text>
      </View>
      <View>
        <Button
          label={_(msg`Chat settings`)}
          color="secondary"
          size="large"
          variant="ghost"
          style={[{height: 'auto', width: 'auto'}, a.px_sm, a.py_sm]}
          onPress={() => {}}>
          <ButtonIcon icon={DotGrid_Stroke2_Corner0_Rounded} />
        </Button>
      </View>
    </View>
  )
}

Header = React.memo(Header)
