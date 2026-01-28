import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
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
}: {
  onSelectDraft: (draft: DraftSummary) => void
  onSaveDraft: () => Promise<void>
  onDiscard: () => void
  isEmpty: boolean
  isDirty: boolean
  isEditingDraft: boolean
}) {
  const {_} = useLingui()
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
    await onSaveDraft()
    draftsDialogControl.open()
  }

  const handleDiscardAndOpen = () => {
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
            {isEditingDraft ? (
              <Trans>Save changes?</Trans>
            ) : (
              <Trans>Save draft?</Trans>
            )}
          </Prompt.TitleText>
        </Prompt.Content>
        <Prompt.DescriptionText>
          {isEditingDraft ? (
            <Trans>
              You have unsaved changes. Would you like to save them before
              viewing your drafts?
            </Trans>
          ) : (
            <Trans>
              Would you like to save this as a draft before viewing your drafts?
            </Trans>
          )}
        </Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Action
            cta={isEditingDraft ? _(msg`Save changes`) : _(msg`Save draft`)}
            onPress={handleSaveAndOpen}
            color="primary"
          />
          <Prompt.Action
            cta={_(msg`Discard`)}
            onPress={handleDiscardAndOpen}
            color="negative_subtle"
          />
          <Prompt.Cancel />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
