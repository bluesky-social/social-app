import {type $Typed} from '@atproto/lex'

import type * as Dialog from '#/components/Dialog'
import {type app, type chat} from '#/lexicons'

export type ReportSubjectConvoMessage = {
  view: 'convo' | 'message'
  convoId: string
  message: chat.bsky.convo.defs.MessageView
}

export type ReportSubjectConvo = {
  convoId: string
  did: string
}

export type ReportSubject =
  | $Typed<app.bsky.actor.defs.ProfileViewBasic>
  | $Typed<app.bsky.actor.defs.ProfileView>
  | $Typed<app.bsky.actor.defs.ProfileViewDetailed>
  | $Typed<app.bsky.actor.defs.StatusView>
  | $Typed<app.bsky.graph.defs.ListView>
  | $Typed<app.bsky.feed.defs.GeneratorView>
  | $Typed<app.bsky.graph.defs.StarterPackView>
  | $Typed<app.bsky.feed.defs.PostView>
  | ReportSubjectConvoMessage
  | ReportSubjectConvo

export type ParsedReportSubject =
  | {
      type: 'post'
      uri: string
      cid: string
      nsid: string
      attributes: {
        reply: boolean
        image: boolean
        video: boolean
        link: boolean
        quote: boolean
      }
    }
  | {
      type: 'status'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'list'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'feed'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'starterPack'
      uri: string
      cid: string
      nsid: string
    }
  | {
      type: 'account'
      did: string
      nsid: string
    }
  | ({
      type: 'convoMessage'
    } & ReportSubjectConvoMessage)
  | ({
      type: 'convo'
    } & ReportSubjectConvo)

export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control']
  subject: ParsedReportSubject
  /**
   * Called if the report was successfully submitted.
   */
  onAfterSubmit?: () => void
  /**
   * Called after the dialog finishes closing.
   */
  onClose?: () => void
}
