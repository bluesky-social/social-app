import {
  type $Typed,
  type ChatBskyConvoDefs,
  type ComAtprotoModerationCreateReport,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/logger'
import {useAgent} from '#/state/session'
import {NEW_TO_OLD_REASONS_MAP} from './const'
import {type ReportState} from './state'
import {type ParsedReportSubject} from './types'

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

      const labeler = state.selectedLabeler
      const labelerSupportedReasonTypes = labeler.reasonTypes || []

      let reasonType = state.selectedOption.reason
      const backwardsCompatibleReasonType = NEW_TO_OLD_REASONS_MAP[reasonType]
      const supportsNewReasonType =
        labelerSupportedReasonTypes.includes(reasonType)
      const supportsOldReasonType = labelerSupportedReasonTypes.includes(
        backwardsCompatibleReasonType,
      )

      /*
       * Only fall back for backwards compatibility if the labeler
       * does not support the new reason type. If the labeler does not declare
       * supported reason types, send the new version.
       */
      if (supportsOldReasonType && !supportsNewReasonType) {
        reasonType = backwardsCompatibleReasonType
      }

      let report:
        | ComAtprotoModerationCreateReport.InputSchema
        | (Omit<ComAtprotoModerationCreateReport.InputSchema, 'subject'> & {
            subject: $Typed<ChatBskyConvoDefs.MessageRef>
          })

      switch (subject.type) {
        case 'account': {
          report = {
            reasonType,
            reason: state.details,
            subject: {
              $type: 'com.atproto.admin.defs#repoRef',
              did: subject.did,
            },
          }
          break
        }
        case 'status':
        case 'post':
        case 'list':
        case 'feed':
        case 'starterPack': {
          report = {
            reasonType,
            reason: state.details,
            subject: {
              $type: 'com.atproto.repo.strongRef',
              uri: subject.uri,
              cid: subject.cid,
            },
          }
          break
        }
        case 'convoMessage': {
          report = {
            reasonType,
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
            handle: labeler.creator.handle,
          },
          report,
        })
      } else {
        await agent.createModerationReport(report, {
          encoding: 'application/json',
          headers: {
            'atproto-proxy': `${labeler.creator.did}#atproto_labeler`,
          },
        })
      }
    },
  })
}
