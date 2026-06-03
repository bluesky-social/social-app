import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
}

const Context = createContext<MessageDialogsContextType | null>(null)

export function useMessageDialogs() {
  const ctx = useContext(Context)
  if (!ctx) {
    throw new Error('useMessageDialogs must be used within a MessageOverlays')
  }
  return ctx
}

export function MessageOverlays({children}: {children: React.ReactNode}) {
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
  const [reactionsTargetId, setReactionsTargetId] = useState<string | null>(
    null,
  )
  const reactionsOpenRequestedFor = useRef<string | null>(null)

  const liveReactionsMessage = useMemo(() => {
    if (!reactionsTargetId) return null
    for (const item of convo.items) {
      if (
        (item.type === 'message' || item.type === 'pending-message') &&
        item.message.id === reactionsTargetId
      ) {
        return item.message
      }
    }
    return null
  }, [convo.items, reactionsTargetId])

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
      reactionsOpenRequestedFor.current = message.id
      setReactionsTargetId(message.id)
    },
    [],
  )

  // The dialog is conditionally mounted, so we can't open it in the same tick
  // that we set the target - the control ref isn't attached yet. Open in an
  // effect after the dialog has mounted with a live message resolved.
  useEffect(() => {
    if (
      liveReactionsMessage &&
      reactionsOpenRequestedFor.current === liveReactionsMessage.id
    ) {
      reactionsOpenRequestedFor.current = null
      reactionsControl.open()
    }
  }, [liveReactionsMessage, reactionsControl])

  useEffect(() => {
    if (reactionsTargetId && !liveReactionsMessage) {
      reactionsControl.close()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReactionsTargetId(null)
      reactionsOpenRequestedFor.current = null
    }
  }, [reactionsTargetId, liveReactionsMessage, reactionsControl])

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
    () => ({openDeleteMessage, openReportMessage, openReactions}),
    [openDeleteMessage, openReportMessage, openReactions],
  )

  const convoId = convo.convo.view.id
  const reportSubject = useMemo(
    () =>
      reportTarget
        ? ({
            view: 'message',
            convoId,
            message: reportTarget.message,
          } as const)
        : undefined,
    [reportTarget, convoId],
  )

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
      {liveReactionsMessage && (
        <ReactionsDialog
          control={reactionsControl}
          relatedProfiles={convo.relatedProfiles}
          message={liveReactionsMessage}
          onClose={() => {
            setReactionsTargetId(null)
            reactionsOpenRequestedFor.current = null
          }}
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
