import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {useAnalytics} from '#/analytics'
import {DraftsListDialog} from './DraftsListDialog'
import {useSaveDraftMutation} from './state/queries'
import {type DraftSummary} from './state/schema'

export function DraftsButton({
  onSelectDraft,
  onSaveDraft,
  onDiscard,
  isEmpty,
  isDirty,
  isEditingDraft,
  canSaveDraft,
  textLength,
}: {
  onSelectDraft: (draft: DraftSummary) => void
  onSaveDraft: () => Promise<{success: boolean}>
  onDiscard: () => void
  isEmpty: boolean
  isDirty: boolean
  isEditingDraft: boolean
  canSaveDraft: boolean
  textLength: number
}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const draftsDialogControl = Dialog.useDialogControl()
  const savePromptControl = Prompt.usePromptControl()
  const {isPending: isSaving} = useSaveDraftMutation()

  const handlePress = () => {
    if (isEmpty || !isDirty) {
      // Composer is empty or has no unsaved changes, go directly to drafts list
      draftsDialogControl.open()
    } else {
      // Composer has unsaved changes, ask what to do
      savePromptControl.open()
    }
  }

  const handleSaveAndOpen = async () => {
    const {success} = await onSaveDraft()
    if (success) {
      draftsDialogControl.open()
    }
  }

  const handleDiscardAndOpen = () => {
    // Fire draft:discard metric before discarding
    ax.metric('draft:discard', {
      logContext: 'BeforeDraftsList',
      hadContent: !isEmpty,
      textLength,
    })
    onDiscard()
    draftsDialogControl.open()
  }

  return (
    <>
      <Button
        label={_(msg`Drafts`)}
        variant="ghost"
        color="primary"
        shape="default"
        size="small"
        style={[a.rounded_full, a.py_sm, a.px_md, a.mx_xs]}
        disabled={isSaving}
        onPress={handlePress}>
        <ButtonText style={[a.text_md]}>
          <Trans>Drafts</Trans>
        </ButtonText>
      </Button>

      <DraftsListDialog
        control={draftsDialogControl}
        onSelectDraft={onSelectDraft}
      />

      <Prompt.Outer control={savePromptControl}>
        <Prompt.Content>
          <Prompt.TitleText>
            {canSaveDraft ? (
              isEditingDraft ? (
                <Trans>Save changes?</Trans>
              ) : (
                <Trans>Save draft?</Trans>
              )
            ) : (
              <Trans>Discard draft?</Trans>
            )}
          </Prompt.TitleText>
        </Prompt.Content>
        <Prompt.DescriptionText>
          {canSaveDraft ? (
            isEditingDraft ? (
              <Trans>
                You have unsaved changes. Would you like to save them before
                viewing your drafts?
              </Trans>
            ) : (
              <Trans>
                Would you like to save this as a draft before viewing your
                drafts?
              </Trans>
            )
          ) : (
            <Trans>
              You can only save drafts up to 1000 characters. Would you like to
              discard this post before viewing your drafts?
            </Trans>
          )}
        </Prompt.DescriptionText>
        <Prompt.Actions>
          {canSaveDraft && (
            <Prompt.Action
              cta={isEditingDraft ? _(msg`Save changes`) : _(msg`Save draft`)}
              onPress={handleSaveAndOpen}
              color="primary"
            />
          )}
          <Prompt.Action
            cta={_(msg`Discard`)}
            onPress={handleDiscardAndOpen}
            color="negative_subtle"
          />
          <Prompt.Cancel cta={_(msg`Keep editing`)} />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
