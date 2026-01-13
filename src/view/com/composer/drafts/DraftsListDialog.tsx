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
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PageX_Stroke2_Corner0_Rounded_Large as PageXIcon} from '#/components/icons/PageX'
import {Loader} from '#/components/Loader'
import {EmptyState} from '../../util/EmptyState'
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
  const {mutate: deleteDraft} = useDeleteDraft()

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
        variant="ghost">
        <ButtonText style={[a.text_md]}>
          <Trans>Back</Trans>
        </ButtonText>
      </Button>
    ),
    [control, _],
  )

  const listHeader = useMemo(() => {
    return (
      <View>
        <Dialog.Header renderLeft={backButton}>
          <Dialog.HeaderText>
            <Trans>Drafts</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
        {/* Spacer between header and first item */}
        <View style={[{height: 12}]} />
      </View>
    )
  }, [backButton])

  const renderItem = useCallback(
    ({item}: {item: DraftSummary}) => {
      return (
        <View style={[a.px_lg]}>
          <DraftItem
            draft={item}
            onSelect={handleSelectDraft}
            onDelete={handleDeleteDraft}
          />
        </View>
      )
    },
    [handleSelectDraft, handleDeleteDraft],
  )

  const itemSeparator = useCallback(() => <View style={[{height: 12}]} />, [])

  const emptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={[a.py_xl, a.align_center]}>
          <Loader size="lg" />
        </View>
      )
    }
    return (
      <EmptyState
        icon={PageXIcon}
        message={_(msg`No drafts yet`)}
        style={[a.justify_center, {minHeight: 500}]}
      />
    )
  }, [isLoading, _])

  return (
    <Dialog.Outer control={control}>
      <Dialog.InnerFlatList
        data={drafts ?? []}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={itemSeparator}
        stickyHeaderIndices={[0]}
        style={[t.atoms.bg_contrast_50, a.px_0]}
        webInnerContentContainerStyle={[a.py_0]}
      />
    </Dialog.Outer>
  )
}
