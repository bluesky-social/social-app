import {View} from 'react-native'
import {
  type ChatBskyGroupDefs,
  ChatBskyGroupWithdrawJoinRequest,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {isNetworkError} from '#/lib/strings/errors'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useWithdrawJoinGroupChatRequest} from '#/state/queries/messages/withdraw-join-group-chat'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {atoms as a, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {createStaticClick, Link} from '#/components/Link'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function OutgoingRequestListItem({
  convo: convoView,
}: {
  convo: ChatBskyGroupDefs.JoinRequestConvoView
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const prompt = Prompt.usePromptControl()

  const moderationOpts = useModerationOpts()

  const {mutate: withdrawRequest, isPending: isWithdrawPending} =
    useWithdrawJoinGroupChatRequest({
      onSuccess: () => {
        Toast.show(l`Join request rescinded.`)
      },
      onError: error => {
        let errorMessage = l`Failed to rescind your request. Please try again.`
        if (isNetworkError(error)) {
          errorMessage = l`There was a problem with your internet connection, please try again`
        } else if (
          error instanceof
          ChatBskyGroupWithdrawJoinRequest.InvalidJoinRequestError
        ) {
          errorMessage = l`Invalid rescind request.`
        }
        Toast.show(errorMessage)
      },
    })

  return (
    <>
      <Link
        label={l`Rescind request to join group chat`}
        {...createStaticClick(() => {
          prompt.open()
        })}>
        {({hovered, pressed, focused}) => (
          <View
            style={[
              a.flex_row,
              a.align_center,
              a.flex_1,
              a.px_lg,
              a.py_md,
              a.gap_md,
              (hovered || pressed || focused) && t.atoms.bg_contrast_25,
            ]}>
            <AvatarBubbles
              profiles={[
                convoView?.owner ?? undefined,
                ...Array(
                  Math.min(3, Math.max(0, convoView.memberCount - 1)),
                ).fill(undefined),
              ]}
              size={48}
              moderationOpts={moderationOpts}
            />
            <View style={[a.flex_1]}>
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.align_center,
                  a.gap_xs,
                  a.pb_2xs,
                ]}>
                <View style={[a.flex_shrink]}>
                  <Text
                    emoji
                    numberOfLines={1}
                    style={[a.text_md, a.font_semi_bold]}>
                    {convoView.name}
                  </Text>
                </View>
                {convoView.viewer?.requestedAt ? (
                  <TimeElapsed timestamp={convoView.viewer.requestedAt}>
                    {({timeElapsed}) => (
                      <Text
                        style={[
                          a.text_sm,
                          t.atoms.text_contrast_medium,
                          web({whiteSpace: 'preserve nowrap'}),
                        ]}>
                        {timeElapsed}
                      </Text>
                    )}
                  </TimeElapsed>
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                style={[a.text_sm, t.atoms.text_contrast_high]}>
                <Trans comment="Displayed when the user has requested to join a group chat.">
                  You requested to join
                </Trans>
              </Text>
            </View>
          </View>
        )}
      </Link>
      <Prompt.Basic
        control={prompt}
        title={l`Rescind request`}
        description={l`Are you sure you want to rescind your request to join ${convoView.name}?`}
        confirmButtonCta={l`Rescind request`}
        onConfirm={() => {
          prompt.close(() => {
            if (isWithdrawPending) return
            withdrawRequest({convoId: convoView.convoId})
          })
        }}
      />
    </>
  )
}
