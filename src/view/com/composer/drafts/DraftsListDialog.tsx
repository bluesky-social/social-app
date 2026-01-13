import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type DraftSummary,
  type StoredDraft,
  useDeleteDraft,
  useDrafts,
  useLoadDraft,
} from '#/state/drafts'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {DraftItem} from './DraftItem'

export function DraftsListDialog({
  control,
  onSelectDraft,
}: {
  control: Dialog.DialogControlProps
  onSelectDraft: (draft: StoredDraft) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: drafts, isLoading} = useDrafts()
  const loadDraft = useLoadDraft()
  const {mutate: deleteDraft, isPending: isDeleting} = useDeleteDraft()

  const handleSelectDraft = useCallback(
    async (summary: DraftSummary) => {
      const draft = await loadDraft(summary.id)
      if (draft) {
        control.close(() => {
          onSelectDraft(draft)
        })
      }
    },
    [loadDraft, control, onSelectDraft],
  )

  const handleDeleteDraft = useCallback(
    (draftId: string) => {
      deleteDraft(draftId)
    },
    [deleteDraft],
  )

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={_(msg`Your Drafts`)}>
        <View style={[a.gap_md]}>
          <Text style={[a.text_2xl, a.font_semi_bold]}>
            <Trans>Your Drafts</Trans>
          </Text>

          {isLoading ? (
            <View style={[a.py_xl, a.align_center]}>
              <Loader size="lg" />
            </View>
          ) : drafts && drafts.length > 0 ? (
            <View style={[a.gap_sm]}>
              {drafts.map(draft => (
                <DraftItem
                  key={draft.id}
                  draft={draft}
                  onSelect={handleSelectDraft}
                  onDelete={handleDeleteDraft}
                  isDeleting={isDeleting}
                />
              ))}
            </View>
          ) : (
            <View style={[a.py_xl, a.align_center]}>
              <Text style={[t.atoms.text_contrast_medium]}>
                <Trans>No drafts saved</Trans>
              </Text>
            </View>
          )}
        </View>

        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
