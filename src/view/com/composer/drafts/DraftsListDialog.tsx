import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {EmptyState} from '#/view/com/util/EmptyState'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PageX_Stroke2_Corner0_Rounded_Large as PageXIcon} from '#/components/icons/PageX'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {IS_NATIVE} from '#/env'
import {DraftItem} from './DraftItem'
import {useDeleteDraftMutation, useDraftsQuery} from './state/queries'
import {type DraftSummary} from './state/schema'

export function DraftsListDialog({
  control,
  onSelectDraft,
}: {
  control: Dialog.DialogControlProps
  onSelectDraft: (draft: DraftSummary) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} =
    useDraftsQuery()
  const {mutate: deleteDraft} = useDeleteDraftMutation()

  const drafts = useMemo(
    () => data?.pages.flatMap(page => page.drafts) ?? [],
    [data],
  )

  const handleSelectDraft = useCallback(
    (summary: DraftSummary) => {
      control.close(() => {
        onSelectDraft(summary)
      })
    },
    [control, onSelectDraft],
  )

  const handleDeleteDraft = useCallback(
    (draftSummary: DraftSummary) => {
      deleteDraft({draftId: draftSummary.id, draft: draftSummary.draft})
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

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

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

  const footerComponent = useMemo(
    () => (
      <ListFooter
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        style={[a.border_transparent]}
      />
    ),
    [isFetchingNextPage, hasNextPage],
  )

  return (
    <Dialog.Outer control={control}>
      {/* We really really need to figure out a nice, consistent API for doing a header cross-platform -sfn */}
      {IS_NATIVE && header}
      <Dialog.InnerFlatList
        data={drafts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={web(header)}
        stickyHeaderIndices={web([0])}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        style={[t.atoms.bg_contrast_50, a.px_0, web({minHeight: 500})]}
        webInnerContentContainerStyle={[a.py_0]}
        contentContainerStyle={[a.pb_xl]}
      />
    </Dialog.Outer>
  )
}
