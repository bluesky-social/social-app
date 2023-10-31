import {s} from 'lib/styles'
import {isAndroid, isMobileWeb, isWeb} from 'platform/detection'
import React from 'react'
import {KeyboardAvoidingView, Platform, StyleSheet, View} from 'react-native'
import {FlatList, ListRenderItemInfo} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {MessageRow} from 'view/com/wingman/Message'
import {SuggestionList} from 'view/com/wingman/Suggestions'
import {UniversalInput} from 'view/com/wingman/UniversalInput'
import {UserMessage} from 'view/com/wingman/types'
import uuid from 'react-native-uuid'

interface Props {}

const DATA = [
  {
    messageId: '1',
    senderUserId: 'abc',
    content: 'Hi Phil!  What can I do for you regarding this article?',
  },
  {
    messageId: '2',
    senderUserId: 'xyz',
    content: 'Hello!',
  },
].reverse()

const DUMMY_SUGGESTIONS = [
  'What else is new?',
  'Where can I learn more?',
  'Show me more like this',
]

const currUserId = 'xyz'

export const WingmanChat = function WingmanChat({}: Props) {
  const [messages, setMessages] = React.useState(DATA)

  const onPostMessage = React.useCallback((t: string, senderUserId: string) => {
    // some api call here
    setMessages(prev => {
      const copy = [...prev]
      copy.splice(0, 0, {
        messageId: uuid.v4().toString(),
        senderUserId,
        content: t,
      })
      return copy
    })
  }, [])

  const onSubmitPress = React.useCallback(
    (t: string) => {
      onPostMessage(t, currUserId)
    },
    [onPostMessage],
  )

  const onSuggestionPress = React.useCallback(
    (content: string) => {
      onPostMessage(content, currUserId)
    },
    [onPostMessage],
  )

  const renderItemRow = React.useCallback(
    ({item}: ListRenderItemInfo<UserMessage>) => {
      const pos = item.senderUserId === currUserId ? 'right' : 'left'
      return (
        <MessageRow message={item} position={pos} style={styles.bottomNormal} />
      )
    },
    [],
  )

  const insets = useSafeAreaInsets()
  const viewStyles = React.useMemo(
    () => ({
      paddingBottom: isAndroid ? insets.bottom : 0,
      paddingTop: isAndroid ? insets.top : isMobileWeb ? 15 : 0,
      paddingHorizontal: 8,
    }),
    [insets],
  )

  // TODO: impl send button

  return (
    <KeyboardAvoidingView
      testID="composePostView"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[s.flex1, s.flexCol, s.h100pct, styles.outer]}
      keyboardVerticalOffset={insets.bottom + insets.top}>
      <View style={[s.flex1, viewStyles]}>
        <FlatList
          data={messages}
          renderItem={renderItemRow}
          keyExtractor={i => i.messageId}
          style={[s.flex1]} //s.flex1
          contentContainerStyle={styles.listContainer}
          inverted
          keyboardShouldPersistTaps={'handled'}
        />
        <UniversalInput
          placeholder="Tell Waverly..."
          onSubmit={onSubmitPress}
        />
        <Divider />
        <SuggestionList
          suggestions={DUMMY_SUGGESTIONS}
          style={styles.suggestionList}
          onPress={onSuggestionPress}
        />
        <Divider />
      </View>
    </KeyboardAvoidingView>
  )
}

function Divider() {
  const style = {height: 5}
  return <View style={style} />
}

const styles = StyleSheet.create({
  outer: {
    // flexGrow: 1,
    // backgroundColor: 'rgba(185, 125, 212, 1)',
  },
  listContainer: {
    // paddingHorizontal: 8,
    paddingBottom: 60,
    // height: '100%',
  },
  bottomNormal: {
    paddingBottom: 7,
  },
  bottomExtra: {
    paddingBottom: 12,
  },
  suggestionList: {
    flexGrow: 0,
    paddingBottom: !isWeb ? 10 : 0,
  },
})
