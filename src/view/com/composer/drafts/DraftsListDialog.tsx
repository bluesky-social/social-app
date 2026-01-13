import {useCallback, useMemo} from 'react'
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
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
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

  const backButton = useCallback(
    () => (
      <Button
        label={_(msg`Back`)}
        onPress={() => control.close()}
        size="small"
        color="primary"
        variant="ghost"
        shape="round">
        <ButtonIcon icon={ArrowLeftIcon} size="md" />
      </Button>
    ),
    [control, _],
  )

  const listHeader = useMemo(() => {
    return (
      <Dialog.Header renderLeft={backButton}>
        <Dialog.HeaderText>
          <Trans>Drafts</Trans>
        </Dialog.HeaderText>
      </Dialog.Header>
    )
  }, [backButton])

  const renderItem = useCallback(
    ({item}: {item: DraftSummary}) => {
      return (
        <DraftItem
          draft={item}
          onSelect={handleSelectDraft}
          onDelete={handleDeleteDraft}
          isDeleting={isDeleting}
        />
      )
    },
    [handleSelectDraft, handleDeleteDraft, isDeleting],
  )

  const emptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={[a.py_xl, a.align_center]}>
          <Loader size="lg" />
        </View>
      )
    }
    return (
      <View style={[a.py_xl, a.align_center]}>
        <Text style={[t.atoms.text_contrast_medium]}>
          <Trans>No drafts saved</Trans>
        </Text>
      </View>
    )
  }, [isLoading, t.atoms.text_contrast_medium])

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.InnerFlatList
        data={drafts ?? []}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        stickyHeaderIndices={[0]}
        contentContainerStyle={[a.pb_lg]}
        ItemSeparatorComponent={() => <View style={[{height: 8}]} />}
        style={[a.px_lg]}
      />
    </Dialog.Outer>
  )
}
