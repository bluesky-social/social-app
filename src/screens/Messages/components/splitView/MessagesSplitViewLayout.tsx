import {View} from 'react-native'
import {type ScreenLayoutArgs, useIsFocused} from '@react-navigation/native'
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

import {type FlatNavigatorParams} from '#/lib/routes/types'
import {type NativeStackNavigationOptionsWithAuth} from '#/view/shell/createNativeStackNavigatorWithAuth'
import {atoms as a, useLayoutBreakpoints, useTheme, web} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {NewChat} from '#/components/dms/dialogs/NewChatDialog'
import {SCROLLBAR_OFFSET} from '#/components/Layout'
import {LockScroll} from '#/components/LockScroll'
import {useAgeAssurance} from '#/ageAssurance'
import {IS_WEB} from '#/env'
import {ChatList, Header as ChatListHeader} from '../../ChatList'
import {SplitViewProvider} from './context'

const CENTER_COLUMN_WIDTH = 600
const LEFT_NAV_FULL_WIDTH = 245
const LEFT_NAV_MINIMAL_WIDTH = 86
const RIGHT_NAV_FULL_WIDTH = 330
const RIGHT_NAV_MINIMAL_WIDTH = 280

type MessageScreens =
  | 'Messages'
  | 'MessagesConversation'
  | 'MessagesConversationSettings'
  | 'MessagesInbox'
  | 'MessagesSettings'

type LayoutProps = ScreenLayoutArgs<
  FlatNavigatorParams,
  MessageScreens,
  NativeStackNavigationOptionsWithAuth,
  NativeStackNavigationProp<
    FlatNavigatorParams,
    MessageScreens,
    string | undefined
  >
>
export function renderMessagesSplitViewLayout(props: LayoutProps) {
  return <MessagesSplitViewLayout {...props} />
}

function MessagesSplitViewLayout({children, navigation, route}: LayoutProps) {
  const {rightNavVisible, centerColumnOffset} = useLayoutBreakpoints()
  const newChatControl = useDialogControl()
  const t = useTheme()
  const aa = useAgeAssurance()
  const isFocused = useIsFocused()

  if (!IS_WEB || !rightNavVisible || aa.state.access !== aa.Access.Full) {
    return children
  }

  const onNewChat = (conversation: string) =>
    navigation.navigate('MessagesConversation', {conversation})

  const selectedChat =
    (route.name === 'MessagesConversation' ||
      route.name === 'MessagesConversationSettings') &&
    route.params &&
    'conversation' in route.params
      ? route.params.conversation
      : undefined

  const rightNavWidth = centerColumnOffset
    ? RIGHT_NAV_MINIMAL_WIDTH
    : RIGHT_NAV_FULL_WIDTH

  const leftNavWidth = centerColumnOffset
    ? LEFT_NAV_MINIMAL_WIDTH
    : LEFT_NAV_FULL_WIDTH - LEFT_NAV_MINIMAL_WIDTH

  // slight reduce width for smaller breakpoint
  const centerColumnWidth = centerColumnOffset
    ? CENTER_COLUMN_WIDTH - 50
    : CENTER_COLUMN_WIDTH

  // nasty magic numbers here, sorry :(
  const offset = centerColumnOffset
    ? LEFT_NAV_MINIMAL_WIDTH - 34
    : LEFT_NAV_MINIMAL_WIDTH + 5

  const containerWidth = leftNavWidth + centerColumnWidth + rightNavWidth

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.mx_auto,
        {maxWidth: containerWidth},
        {
          transform: [
            {translateX: offset},
            {translateX: web(SCROLLBAR_OFFSET) ?? 0},
          ],
        },
      ]}>
      {isFocused && <LockScroll />}
      <SplitViewProvider side="left">
        <View
          style={[
            a.border_l,
            t.atoms.border_contrast_low,
            {width: containerWidth - centerColumnWidth},
          ]}>
          <ChatListHeader newChatControl={newChatControl} />
          <ChatList
            newChatControl={newChatControl}
            selectedChat={selectedChat}
          />
          <NewChat onNewChat={onNewChat} control={newChatControl} />
        </View>
      </SplitViewProvider>
      <SplitViewProvider side="right">
        <View
          style={[
            a.border_x,
            t.atoms.border_contrast_low,
            {width: centerColumnWidth},
          ]}>
          {children}
        </View>
      </SplitViewProvider>
    </View>
  )
}
