import {View} from 'react-native'
import {type ScreenLayoutArgs, useIsFocused} from '@react-navigation/native'
import {RemoveScrollBar} from 'react-remove-scroll-bar'

import {type AllNavigatorParams, type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useLayoutBreakpoints, useTheme, web} from '#/alf'
import {useDialogControl} from '#/components/Dialog'
import {NewChat} from '#/components/dms/dialogs/NewChatDialog'
import {SCROLLBAR_OFFSET} from '#/components/Layout'
import {useAgeAssurance} from '#/ageAssurance'
import {IS_WEB} from '#/env'
import {ChatList, Header as ChatListHeader} from '../../ChatList'
import {SplitViewProvider} from './context'

const CENTER_COLUMN_WIDTH = 600
const LEFT_NAV_FULL_WIDTH = 245
const LEFT_NAV_MINIMAL_WIDTH = 86
const RIGHT_NAV_FULL_WIDTH = 330 + 28
const RIGHT_NAV_MINIMAL_WIDTH = 280 + 28

type LayoutProps = ScreenLayoutArgs<
  AllNavigatorParams,
  'MessagesConversation',
  {},
  NavigationProp
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
    route.name === 'MessagesConversation'
      ? route?.params?.conversation
      : undefined

  const leftNavWidth = centerColumnOffset
    ? LEFT_NAV_MINIMAL_WIDTH
    : LEFT_NAV_FULL_WIDTH
  const rightNavWidth = centerColumnOffset
    ? RIGHT_NAV_MINIMAL_WIDTH
    : RIGHT_NAV_FULL_WIDTH

  const containerWidth =
    leftNavWidth - LEFT_NAV_MINIMAL_WIDTH + CENTER_COLUMN_WIDTH + rightNavWidth

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.mx_auto,
        {maxWidth: containerWidth},
        {
          transform: [
            {translateX: LEFT_NAV_MINIMAL_WIDTH / 2},
            {translateX: web(SCROLLBAR_OFFSET) ?? 0},
          ],
        },
      ]}>
      {isFocused && <RemoveScrollBar />}
      <SplitViewProvider side="left">
        <View
          style={[
            a.border_l,
            t.atoms.border_contrast_low,
            {width: centerColumnOffset ? 300 : 350},
          ]}>
          <ChatListHeader newChatControl={newChatControl} />
          <ChatList selectedChat={selectedChat} />
          <NewChat onNewChat={onNewChat} control={newChatControl} />
        </View>
      </SplitViewProvider>
      <SplitViewProvider side="right">
        <View style={[a.border_x, t.atoms.border_contrast_low, {width: 600}]}>
          {children}
        </View>
      </SplitViewProvider>
    </View>
  )
}
