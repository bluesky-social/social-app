import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type StoredDraft, useDrafts, useSaveDraft} from '#/state/drafts'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PageText_Stroke2_Corner0_Rounded as DraftIcon} from '#/components/icons/PageText'
import * as Prompt from '#/components/Prompt'
import {Text} from '#/components/Typography'
import {DraftsListDialog} from './DraftsListDialog'

export function DraftsButton({
  onSelectDraft,
  onSaveDraft,
  isEmpty,
}: {
  onSelectDraft: (draft: StoredDraft) => void
  onSaveDraft: () => Promise<void>
  isEmpty: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const draftsDialogControl = Dialog.useDialogControl()
  const savePromptControl = Prompt.usePromptControl()
  const {data: drafts} = useDrafts()
  const {isPending: isSaving} = useSaveDraft()

  const draftCount = drafts?.length ?? 0

  const handlePress = () => {
    if (isEmpty) {
      // Composer is empty, go directly to drafts list
      draftsDialogControl.open()
    } else {
      // Composer has content, ask what to do
      savePromptControl.open()
    }
  }

  const handleSaveAndOpen = async () => {
    await onSaveDraft()
    draftsDialogControl.open()
  }

  const handleDiscardAndOpen = () => {
    draftsDialogControl.open()
  }

  return (
    <>
      <Button
        label={_(msg`Drafts`)}
        variant="ghost"
        color="secondary"
        shape="round"
        size="small"
        style={[a.mx_xs]}
        disabled={isSaving}
        onPress={handlePress}>
        <ButtonIcon icon={DraftIcon} />
        {draftCount > 0 && (
          <View
            style={[
              a.absolute,
              a.rounded_full,
              {
                top: -2,
                right: -2,
                minWidth: 16,
                height: 16,
                backgroundColor: t.palette.primary_500,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              },
            ]}>
            <Text style={[a.text_2xs, a.font_bold, {color: t.palette.white}]}>
              {draftCount}
            </Text>
          </View>
        )}
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
            cta={_(msg`Save & View Drafts`)}
            onPress={handleSaveAndOpen}
            color="primary"
          />
          <Prompt.Action
            cta={_(msg`Discard & View Drafts`)}
            onPress={handleDiscardAndOpen}
            color="negative"
          />
          <Prompt.Cancel />
        </Prompt.Actions>
      </Prompt.Outer>
    </>
  )
}
