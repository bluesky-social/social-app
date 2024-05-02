import React, {useMemo} from 'react'
import {View} from 'react-native'
import {ChatBskyConvoDefs} from '@atproto-labs/api'

import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {MessageItemMetadata} from '#/components/dms/MesageItemMetadata'
import {Text} from '#/components/Typography'

export function MessageItem({
  item,
  next,
}: {
  item: ChatBskyConvoDefs.MessageView
  next:
    | ChatBskyConvoDefs.MessageView
    | ChatBskyConvoDefs.DeletedMessageView
    | null
}) {
  const t = useTheme()
  const {currentAccount} = useSession()

  const isFromSelf = item.sender?.did === currentAccount?.did

  const isNextFromSelf =
    ChatBskyConvoDefs.isMessageView(next) &&
    next.sender?.did === currentAccount?.did

  const isLastInGroup = useMemo(() => {
    // if the next message is from a different sender, then it's the last in the group
    if (isFromSelf ? !isNextFromSelf : isNextFromSelf) {
      return true
    }

    // or, if there's a 10 minute gap between this message and the next
    if (ChatBskyConvoDefs.isMessageView(next)) {
      const thisDate = new Date(item.sentAt)
      const nextDate = new Date(next.sentAt)

      const diff = nextDate.getTime() - thisDate.getTime()

      // 10 minutes
      return diff > 10 * 60 * 1000
    }

    return true
  }, [item, next, isFromSelf, isNextFromSelf])

  return (
    <View>
      <View
        style={[
          a.py_sm,
          a.px_lg,
          a.my_2xs,
          a.rounded_md,
          isFromSelf ? a.self_end : a.self_start,
          {
            maxWidth: '65%',
            backgroundColor: isFromSelf
              ? t.palette.primary_500
              : t.palette.contrast_50,
            borderRadius: 17,
          },
          isFromSelf
            ? {borderBottomRightRadius: isLastInGroup ? 2 : 17}
            : {borderBottomLeftRadius: isLastInGroup ? 2 : 17},
        ]}>
        <Text
          style={[
            a.text_md,
            a.leading_snug,
            isFromSelf && {color: t.palette.white},
          ]}>
          {item.text}
        </Text>
      </View>
      <MessageItemMetadata
        message={item}
        isLastInGroup={isLastInGroup}
        style={isFromSelf ? a.text_right : a.text_left}
      />
    </View>
  )
}
