import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {LayoutAnimation} from 'react-native'
import {type ChatBskyConvoDefs} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {useConvoActive} from '#/state/messages/convo'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {useDialogControl} from '#/components/Dialog'
import {AfterReportDialog} from '#/components/dms/AfterReportDialog'
import {ReactionsDialog} from '#/components/dms/ReactionsDialog'
import {ReportDialog} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import {usePromptControl} from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import type * as bsky from '#/types/bsky'

type MessageDialogsContextType = {
  openDeleteMessage: (message: ChatBskyConvoDefs.MessageView) => void
  openReportMessage: (
    message: ChatBskyConvoDefs.MessageView,
    senderProfile: bsky.profile.AnyProfileView | undefined,
  ) => void
  openReactions: (message: ChatBskyConvoDefs.MessageView) => void
  /**
   * The message currently staged for reply in the composer, or null.
   */
  replyTo: ChatBskyConvoDefs.MessageView | null
  openReply: (message: ChatBskyConvoDefs.MessageView) => void
  clearReply: () => void
  /**
   * Scroll the list to a message, if it's currently loaded. No-op otherwise.
   */
  scrollToMessage: (messageId: string) => void
}

const Context = createContext<MessageDialogsContextType | null>(null)

export function useMessageDialogs() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('useMessageDialogs must be used within a MessageOverlays')
  }
  return ctx
}

export function MessageOverlays({
  children,
  scrollToMessage,
}: {
  children: React.ReactNode
  scrollToMessage: (messageId: string) => void
}) {
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const convo = useConvoActive()

  const deleteControl = usePromptControl()
  const reportControl = usePromptControl()
  const afterReportControl = usePromptControl()
  const reactionsControl = useDialogControl()

  const [deleteTarget, setDeleteTarget] =
    useState<ChatBskyConvoDefs.MessageView | null>(null)
  const [reportTarget, setReportTarget] = useState<{
    message: ChatBskyConvoDefs.MessageView
    senderProfile: bsky.profile.AnyProfileView | undefined
  } | null>(null)
  const [afterReportTarget, setAfterReportTarget] =
    useState<ChatBskyConvoDefs.MessageView | null>(null)
  const [reactionsTarget, setReactionsTarget] =
    useState<ChatBskyConvoDefs.MessageView | null>(null)
  const [replyTo, setReplyTo] = useState<ChatBskyConvoDefs.MessageView | null>(
    null,
  )

  const openDeleteMessage = useCallback(
    (message: ChatBskyConvoDefs.MessageView) => {
      setDeleteTarget(message)
      deleteControl.open()
    },
    [deleteControl],
  )

  const openReportMessage = useCallback(
    (
      message: ChatBskyConvoDefs.MessageView,
      senderProfile: bsky.profile.AnyProfileView | undefined,
    ) => {
      setReportTarget({message, senderProfile})
      reportControl.open()
    },
    [reportControl],
  )

  const openReactions = useCallback(
    (message: ChatBskyConvoDefs.MessageView) => {
      setReactionsTarget(message)
    },
    [],
  )

  const openReply = useCallback((message: ChatBskyConvoDefs.MessageView) => {
    setReplyTo(message)
  }, [])

  const clearReply = useCallback(() => {
    setReplyTo(null)
  }, [])

  // These dialogs are conditionally mounted, so we can't open them in the same
  // tick that we set their targets - the control refs aren't attached yet. Open
  // in an effect after the dialog has mounted.
  useEffect(() => {
    if (reactionsTarget) {
      reactionsControl.open()
    }
  }, [reactionsTarget, reactionsControl])

  useEffect(() => {
    if (afterReportTarget) {
      afterReportControl.open()
    }
  }, [afterReportTarget, afterReportControl])

  const onConfirmDelete = useCallback(() => {
    if (!deleteTarget) return
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    convo
      .deleteMessage(deleteTarget.id)
      .then(() => Toast.show(l({message: 'Message deleted', context: 'toast'})))
      .catch(() => Toast.show(l`Failed to delete message`))
  }, [l, convo, deleteTarget])

  const onAfterReportSubmit = useCallback(() => {
    if (!reportTarget) return
    if (reportTarget.senderProfile) {
      unstableCacheProfileView(queryClient, reportTarget.senderProfile)
    }
    setAfterReportTarget(reportTarget.message)
  }, [queryClient, reportTarget])

  const ctx = useMemo<MessageDialogsContextType>(
    () => ({
      openDeleteMessage,
      openReportMessage,
      openReactions,
      replyTo,
      openReply,
      clearReply,
      scrollToMessage,
    }),
    [
      openDeleteMessage,
      openReportMessage,
      openReactions,
      replyTo,
      openReply,
      clearReply,
      scrollToMessage,
    ],
  )

  // `reactionsTarget` is a snapshot from when the dialog was opened. Read the
  // live message out of the convo items so optimistic reaction changes (e.g.
  // "Tap to remove") are reflected in the dialog without closing it first.
  const reactionsMessage = useMemo(() => {
    if (!reactionsTarget) return null
    for (const item of convo.items) {
      if (
        (item.type === 'message' || item.type === 'pending-message') &&
        item.message.id === reactionsTarget.id
      ) {
        return item.message
      }
    }
    return reactionsTarget
  }, [convo.items, reactionsTarget])

  const reportSubject = reportTarget
    ? ({
        view: 'message',
        convoId: convo.convo.view.id,
        message: reportTarget.message,
      } as const)
    : undefined

  return (
    <Context.Provider value={ctx}>
      {children}
      <ReportDialog
        control={reportControl}
        subject={reportSubject}
        onAfterSubmit={onAfterReportSubmit}
        onClose={() => setReportTarget(null)}
      />
      {afterReportTarget && (
        <AfterReportDialog
          control={afterReportControl}
          currentScreen="conversation"
          params={{
            convoId: convo.convo.view.id,
            did: afterReportTarget.sender.did,
          }}
          onClose={() => setAfterReportTarget(null)}
        />
      )}
      {reactionsMessage && (
        <ReactionsDialog
          control={reactionsControl}
          relatedProfiles={convo.relatedProfiles}
          message={reactionsMessage}
          onClose={() => setReactionsTarget(null)}
        />
      )}
      <Prompt.Basic
        control={deleteControl}
        title={l`Delete message`}
        description={l`Are you sure you want to delete this message? The message will be deleted for you, but not for the other participants.`}
        confirmButtonCta={l`Delete`}
        confirmButtonColor="negative"
        onConfirm={onConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Context.Provider>
  )
}
