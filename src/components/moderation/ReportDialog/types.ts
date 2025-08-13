import {
  type $Typed,
  type AppBskyActorDefs as AppGndrActorDefs,
  type AppBskyFeedDefs as AppGndrFeedDefs,
  type AppBskyGraphDefs as AppGndrGraphDefs,
  type ChatBskyConvoDefs as ChatGndrConvoDefs,
} from '@atproto/api'

import type * as Dialog from '#/components/Dialog'

export type ReportSubject =
  | $Typed<AppGndrActorDefs.ProfileViewBasic>
  | $Typed<AppGndrActorDefs.ProfileView>
  | $Typed<AppGndrActorDefs.ProfileViewDetailed>
  | $Typed<AppGndrGraphDefs.ListView>
  | $Typed<AppGndrFeedDefs.GeneratorView>
  | $Typed<AppGndrGraphDefs.StarterPackView>
  | $Typed<AppGndrFeedDefs.PostView>
  | {convoId: string; message: ChatGndrConvoDefs.MessageView}

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
  | {
      type: 'chatMessage'
      convoId: string
      message: ChatGndrConvoDefs.MessageView
    }

export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control']
  subject: ParsedReportSubject
}
