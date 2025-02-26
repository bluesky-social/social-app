import {
  $Typed,
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  ChatBskyConvoDefs,
} from '@atproto/api'

import * as Dialog from '#/components/Dialog'

export type ReportSubject =
  | $Typed<AppBskyActorDefs.ProfileViewBasic>
  | $Typed<AppBskyActorDefs.ProfileView>
  | $Typed<AppBskyActorDefs.ProfileViewDetailed>
  | $Typed<AppBskyGraphDefs.ListView>
  | $Typed<AppBskyFeedDefs.GeneratorView>
  | $Typed<AppBskyGraphDefs.StarterPackView>
  | $Typed<AppBskyFeedDefs.PostView>
  | {convoId: string; message: ChatBskyConvoDefs.MessageView}

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
      message: ChatBskyConvoDefs.MessageView
    }

export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control']
  subject: ParsedReportSubject
}
