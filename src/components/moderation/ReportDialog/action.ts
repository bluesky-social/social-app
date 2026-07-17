import {type Service} from '@atproto/lex-client'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {logger} from '#/logger'
import {usePdsClient} from '#/state/session'
import {com} from '#/lexicons'
import {NEW_TO_OLD_REASONS_MAP} from './const'
import {type ReportState} from './state'
import {type ParsedReportSubject} from './types'
import {
  accountReportSubject,
  chatReportSubject,
  recordReportSubject,
} from './utils/reportSubject'

type CreateReportBody = com.atproto.moderation.createReport.$InputBody

export function useSubmitReportMutation() {
  const {_} = useLingui()
  const pdsClient = usePdsClient()

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

      /*
       * The generated `createReport` subject union only declares repoRef and
       * strongRef; chat subjects (message/convo refs) are accepted on the wire
       * but not in the lexicon. The builders in `./utils/reportSubject` brand
       * the plain-string ids into the schema `subject` slot, keeping the
       * runtime values exact and confining the chat-subject assertion to one
       * place.
       */
      let report: CreateReportBody

      switch (subject.type) {
        case 'account': {
          report = {
            reasonType,
            reason: state.details,
            subject: accountReportSubject(subject.did),
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
            subject: recordReportSubject(subject.uri, subject.cid),
          }
          break
        }
        case 'convoMessage': {
          report = {
            reasonType,
            reason: state.details,
            subject: chatReportSubject({
              $type: 'chat.bsky.convo.defs#messageRef',
              messageId: subject.message.id,
              convoId: subject.convoId,
              did: subject.message.sender.did,
            }),
          }
          break
        }
        case 'convo': {
          report = {
            reasonType,
            reason: state.details,
            subject: chatReportSubject({
              $type: 'chat.bsky.convo.defs#convoRef',
              convoId: subject.convoId,
              did: subject.did,
            }),
          }
          break
        }
      }

      if (__DEV__) {
        logger.info('Submitting report (dry run)', {
          labeler: {
            handle: labeler.creator.handle,
          },
          report,
        })
      } else {
        /*
         * Route the report through the selected labeler's moderation service
         * via the `atproto-proxy` header, which lex-client sets from the
         * per-call `service` option (previously an explicit header on the
         * bridge agent).
         */
        await pdsClient.call(com.atproto.moderation.createReport, report, {
          service: `${labeler.creator.did}#atproto_labeler` as Service,
        })
      }
    },
  })
}
