import {
  type $Typed,
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
  type AppBskyGraphDefs,
  type ChatBskyConvoDefs,
} from '@atproto/api'

import type * as Dialog from '#/components/Dialog'
import type * as bsky from '#/types/bsky'

export type ReportSubjectConvoMessage = {
  view: 'convo' | 'message'
  convoId: string
  message: ChatBskyConvoDefs.MessageView
}

export type ReportSubjectConvo = {
  convoId: string
  did: string
}

export type ReportSubject =
  | $Typed<AppBskyActorDefs.ProfileViewBasic>
  | $Typed<AppBskyActorDefs.ProfileView>
  | $Typed<AppBskyActorDefs.ProfileViewDetailed>
  | $Typed<AppBskyActorDefs.StatusView>
  | $Typed<AppBskyGraphDefs.ListView>
  | $Typed<AppBskyFeedDefs.GeneratorView>
  | $Typed<AppBskyGraphDefs.StarterPackView>
  | $Typed<AppBskyFeedDefs.PostView>
  | ReportSubjectConvoMessage
  | ReportSubjectConvo

export type ParsedReportSubject =
  | {
      type: 'post'
      uri: string
      cid: string
      nsid: string
      /**
       * The post author's profile, used to offer a block action alongside
       * report submission.
       */
      authorProfile: bsky.profile.AnyProfileView
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
      /**
       * The reported account's profile, used to offer a block action
       * alongside report submission.
       */
      profile: bsky.profile.AnyProfileView
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
