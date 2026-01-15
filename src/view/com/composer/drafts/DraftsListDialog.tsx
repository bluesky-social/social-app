import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {type DraftSummary, useDeleteDraft, useDrafts} from '#/state/drafts'
import {atoms as a, useTheme, web} from '#/alf'
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
  onSelectDraft: (draft: DraftSummary) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data: drafts, isLoading} = useDrafts()
  const {mutate: deleteDraft} = useDeleteDraft()

  const handleSelectDraft = useCallback(
    (summary: DraftSummary) => {
      control.close(() => {
        onSelectDraft(summary)
      })
    },
    [control, onSelectDraft],
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

  const renderItem = useCallback(
    ({item}: {item: DraftSummary}) => {
      return (
        <View style={[a.px_lg, a.mt_lg]}>
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

  const header = useMemo(
    () => (
      <Dialog.Header renderLeft={backButton}>
        <Dialog.HeaderText>
          <Trans>Drafts</Trans>
        </Dialog.HeaderText>
      </Dialog.Header>
    ),
    [backButton],
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
      <EmptyState
        icon={PageXIcon}
        message={_(msg`No drafts yet`)}
        style={[a.justify_center, {minHeight: 500}]}
      />
    )
  }, [isLoading, _])

  return (
    <Dialog.Outer control={control}>
      {isNative && header}
      <Dialog.InnerFlatList
        data={drafts ?? []}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={web(header)}
        stickyHeaderIndices={web([0])}
        ListEmptyComponent={emptyComponent}
        style={[t.atoms.bg_contrast_50, a.px_0, web({minHeight: 500})]}
        webInnerContentContainerStyle={[a.py_0]}
      />
    </Dialog.Outer>
  )
}
