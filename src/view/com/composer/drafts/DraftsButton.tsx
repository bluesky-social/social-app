import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type StoredDraft, useSaveDraft} from '#/state/drafts'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Prompt from '#/components/Prompt'
import {DraftsListDialog} from './DraftsListDialog'

export function DraftsButton({
  onSelectDraft,
  onSaveDraft,
  onDiscard,
  isEmpty,
  isDirty,
}: {
  onSelectDraft: (draft: StoredDraft) => void
  onSaveDraft: () => Promise<void>
  onDiscard: () => void
  isEmpty: boolean
  isDirty: boolean
}) {
  const {_} = useLingui()
  const draftsDialogControl = Dialog.useDialogControl()
  const savePromptControl = Prompt.usePromptControl()
  const {isPending: isSaving} = useSaveDraft()

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
        <Prompt.TitleText>
          <Trans>Save current draft?</Trans>
        </Prompt.TitleText>
        <Prompt.DescriptionText>
          <Trans>
            You have unsaved changes. Would you like to save them before viewing
            your drafts?
          </Trans>
        </Prompt.DescriptionText>
        <Prompt.Actions>
          <Prompt.Action
            cta={_(msg`Save changes`)}
            onPress={handleSaveAndOpen}
            color="primary"
          />
          <Prompt.Action
            cta={_(msg`Discard`)}
            onPress={handleDiscardAndOpen}
            color="negative"
          />
          <Prompt.Cancel />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
