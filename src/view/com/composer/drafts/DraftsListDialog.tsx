import {useCallback, useEffect, useMemo} from 'react'
import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useCallOnce} from '#/lib/once'
import {EmptyState} from '#/view/com/util/EmptyState'
import {atoms as a, select, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PageX_Stroke2_Corner0_Rounded_Large as PageXIcon} from '#/components/icons/PageX'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
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
  const {gtPhone} = useBreakpoints()
  const ax = useAnalytics()
  const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} =
    useDraftsQuery()
  const {mutate: deleteDraft} = useDeleteDraftMutation()

  const drafts = useMemo(
    () => data?.pages.flatMap(page => page.drafts) ?? [],
    [data],
  )

  // Fire draft:listOpen metric when dialog opens and data is loaded
  const draftCount = drafts.length
  const isDataReady = !isLoading && data !== undefined
  const onDraftListOpen = useCallOnce()
  useEffect(() => {
    if (isDataReady) {
      onDraftListOpen(() => {
        ax.metric('draft:listOpen', {
          draftCount,
        })
      })
    }
  }, [onDraftListOpen, isDataReady, draftCount, ax])

  const handleSelectDraft = useCallback(
    (summary: DraftSummary) => {
      // Dismiss keyboard immediately to prevent flicker. Without this,
      // the text input regains focus (showing the keyboard) after the
      // drafts sheet closes, then loses it again when the post component
      // remounts with the draft content, causing a show-hide-show cycle -sfn
      Keyboard.dismiss()

      control.close(() => {
        onSelectDraft(summary)
      })
    },
    [control, onSelectDraft],
  )

  const handleDeleteDraft = useCallback(
    (draftSummary: DraftSummary) => {
      // Fire draft:delete metric
      const draftAgeMs = Date.now() - new Date(draftSummary.createdAt).getTime()
      ax.metric('draft:delete', {
        logContext: 'DraftsList',
        draftAgeMs,
      })
      deleteDraft({draftId: draftSummary.id, draft: draftSummary.draft})
    },
    [deleteDraft, ax],
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
        <View style={[gtPhone ? [a.px_md, a.pt_md] : [a.px_sm, a.pt_sm]]}>
          <DraftItem
            draft={item}
            onSelect={handleSelectDraft}
            onDelete={handleDeleteDraft}
          />
        </View>
      )
    },
    [handleSelectDraft, handleDeleteDraft, gtPhone],
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
      void fetchNextPage()
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
      <>
        {drafts.length > 5 && (
          <View style={[a.align_center, a.py_2xl]}>
            <Text style={[a.text_center, t.atoms.text_contrast_medium]}>
              <Trans>So many thoughts, you should post one</Trans>
            </Text>
          </View>
        )}
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          style={[a.border_transparent]}
        />
      </>
    ),
    [isFetchingNextPage, hasNextPage, drafts.length, t],
  )

  return (
    <Dialog.Outer control={control}>
      {/* We really really need to figure out a nice, consistent API for doing a header cross-platform -sfn */}
      {IS_NATIVE && header}
      <Dialog.InnerFlatList
        data={drafts}
        renderItem={renderItem}
        keyExtractor={(item: DraftSummary) => item.id}
        ListHeaderComponent={web(header)}
        stickyHeaderIndices={web([0])}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={footerComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        style={[
          a.px_0,
          web({minHeight: 500}),
          {
            backgroundColor: select(t.name, {
              light: t.palette.contrast_50,
              dark: t.palette.contrast_0,
              dim: '#000000',
            }),
          },
        ]}
        webInnerContentContainerStyle={[a.py_0]}
        contentContainerStyle={[a.pb_xl]}
      />
    </Dialog.Outer>
  )
}
