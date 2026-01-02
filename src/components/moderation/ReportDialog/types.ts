import {
  type $Typed,
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type ChatBskyConvoDefs,
} from '@atproto/api'

import type * as Dialog from '#/components/Dialog'

export type ReportSubjectConvo = {
  view: 'convo' | 'message'
  convoId: string
  message: ChatBskyConvoDefs.MessageView
}

export type ReportSubject =
  | $Typed<AppBskyActorDefs.ProfileViewBasic>
  | $Typed<AppBskyActorDefs.ProfileView>
  | $Typed<AppBskyActorDefs.ProfileViewDetailed>
  | $Typed<AppBskyGraphDefs.ListView>
  | $Typed<AppBskyFeedDefs.GeneratorView>
  | $Typed<AppBskyGraphDefs.StarterPackView>
  | $Typed<AppBskyFeedDefs.PostView>
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
    } & ReportSubjectConvo)

export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control']
  subject: ParsedReportSubject
  /**
   * Called if the report was successfully submitted.
   */
  onAfterSubmit?: () => void
}
