import {
  $Typed,
  ChatBskyConvoDefs,
  ComAtprotoModerationCreateReport,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {ReportState} from './state'
import {ParsedReportSubject} from './types'

export function useSubmitReportMutation() {
  const {_} = useLingui()
  const agent = useAgent()

  return useMutation({
    async mutationFn({
      subject,
      state,
    }: {
      subject: ParsedReportSubject
      state: ReportState
    }) {
      if (!state.selectedOption) {
        throw new Error(_(msg`Please select a reason for this report`))
      }
      if (!state.selectedLabeler) {
        throw new Error(_(msg`Please select a moderation service`))
      }

      let report:
        | ComAtprotoModerationCreateReport.InputSchema
        | (Omit<ComAtprotoModerationCreateReport.InputSchema, 'subject'> & {
            subject: $Typed<ChatBskyConvoDefs.MessageRef>
          })

      switch (subject.type) {
        case 'account': {
          report = {
            reasonType: state.selectedOption.reason,
            reason: state.details,
            subject: {
              $type: 'com.atproto.admin.defs#repoRef',
              did: subject.did,
            },
          }
          break
        }
        case 'post':
        case 'list':
        case 'feed':
        case 'starterPack': {
          report = {
            reasonType: state.selectedOption.reason,
            reason: state.details,
            subject: {
              $type: 'com.atproto.repo.strongRef',
              uri: subject.uri,
              cid: subject.cid,
            },
          }
          break
        }
        case 'chatMessage': {
          report = {
            reasonType: state.selectedOption.reason,
            reason: state.details,
            subject: {
              $type: 'chat.bsky.convo.defs#messageRef',
              messageId: subject.message.id,
              convoId: subject.convoId,
              did: subject.message.sender.did,
            },
          }
          break
        }
      }

      if (__DEV__) {
        logger.info('Submitting report', {
          labeler: {
            handle: state.selectedLabeler.creator.handle,
          },
          report,
        })
      } else {
        await agent.createModerationReport(report, {
          encoding: 'application/json',
          headers: {
            'atproto-proxy': `${state.selectedLabeler.creator.did}#atproto_labeler`,
          },
        })
      }
    },
  })
}
