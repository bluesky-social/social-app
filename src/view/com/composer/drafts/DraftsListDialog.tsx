import {useCallback, useEffect, useMemo} from 'react'
import {Keyboard, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useCallOnce} from '#/lib/once'
import {EmptyState} from '#/view/com/util/EmptyState'
import {atoms as a, select, useBreakpoints, useTheme, web} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PageX_Stroke2_Corner0_Rounded_Large as PageXIcon} from '#/components/icons/PageX'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
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
  const {t: l} = useLingui()
  const t = useTheme()
  const {gtPhone} = useBreakpoints()
  const ax = useAnalytics()
  const {
    data,
    isLoading,
    isError,
    isFetching,
    isRefetching,
    isRefetchError,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useDraftsQuery()
  const {mutate: deleteDraft} = useDeleteDraftMutation()

  const listBackgroundColor = select(t.name, {
    light: t.palette.contrast_50,
    dark: t.palette.contrast_0,
    dim: '#000000',
  })

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
        label={l`Back`}
        onPress={() => control.close()}
        size="small"
        color="primary"
        variant="ghost">
        <ButtonText style={[a.text_md]}>
          <Trans>Back</Trans>
        </ButtonText>
      </Button>
    ),
    [control, l],
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

  /*
   * A failed refresh keeps the cached drafts on screen, so flag them as
   * possibly stale up here rather than below every draft. On native the header
   * sits above the list, and on web it is the sticky list header.
   */
  const header = useMemo(
    () => (
      <>
        <Dialog.Header renderLeft={backButton}>
          <Dialog.HeaderText>
            <Trans>Drafts</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
        {isRefetchError && drafts.length > 0 && (
          <View
            testID="draftsRefreshError"
            style={[
              gtPhone ? [a.px_md, a.pt_md] : [a.px_sm, a.pt_sm],
              {backgroundColor: listBackgroundColor},
            ]}>
            <RefreshError
              isRetrying={isRefetching}
              onRetry={() => void refetch()}
            />
          </View>
        )}
      </>
    ),
    [
      backButton,
      isRefetchError,
      isRefetching,
      refetch,
      drafts.length,
      gtPhone,
      listBackgroundColor,
    ],
  )

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetching && !isError) {
      void fetchNextPage()
    }
  }, [hasNextPage, isFetching, isError, fetchNextPage])

  const emptyComponent = useMemo(() => {
    if (isLoading || isRefetching) {
      return (
        <View style={[a.py_xl, a.align_center]}>
          <Loader size="lg" />
        </View>
      )
    }
    if (isError) {
      return (
        <EmptyState
          testID="draftsLoadError"
          icon={WarningIcon}
          message={l`Could not load drafts. Please try again.`}
          button={{
            testID: 'draftsRetryButton',
            label: l`Retry loading drafts`,
            text: l`Retry`,
            onPress: () => void refetch(),
            color: 'primary',
            size: 'small',
          }}
          style={[a.justify_center, {minHeight: 500}]}
        />
      )
    }
    return (
      <EmptyState
        icon={PageXIcon}
        message={l`No drafts yet`}
        style={[a.justify_center, {minHeight: 500}]}
      />
    )
  }, [isLoading, isRefetching, isError, refetch, l])

  const footerComponent = useMemo(
    () => (
      <>
        {drafts.length > 5 && !isError && (
          <View style={[a.align_center, a.py_2xl]}>
            <Text style={[a.text_center, t.atoms.text_contrast_medium]}>
              <Trans>So many thoughts, you should post one</Trans>
            </Text>
          </View>
        )}
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          error={
            isFetchNextPageError
              ? l`Could not load drafts. Please try again.`
              : undefined
          }
          onRetry={fetchNextPage}
          style={[a.border_transparent]}
        />
      </>
    ),
    [
      isFetchingNextPage,
      hasNextPage,
      isError,
      isFetchNextPageError,
      fetchNextPage,
      drafts.length,
      t,
      l,
    ],
  )

  return (
    <Dialog.Outer
      control={control}
      onOpen={() => void refetch()}
      nativeOptions={{fullHeight: true}}>
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
          {backgroundColor: listBackgroundColor},
        ]}
        webInnerContentContainerStyle={[a.py_0]}
        contentContainerStyle={[a.pb_xl]}
      />
    </Dialog.Outer>
  )
}

function RefreshError({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean
  onRetry: () => void
}) {
  const {t: l} = useLingui()
  return (
    <Admonition.Outer type="error">
      <Admonition.Row style={[a.align_center]}>
        <Admonition.Icon />
        <Admonition.Content>
          <Admonition.Text>
            <Trans>Could not refresh drafts. Some may be out of date.</Trans>
          </Admonition.Text>
        </Admonition.Content>
        <Admonition.Button
          testID="draftsRefreshRetryButton"
          label={l`Retry refreshing drafts`}
          color="secondary"
          disabled={isRetrying}
          onPress={onRetry}>
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
          {isRetrying && <ButtonIcon icon={Loader} />}
        </Admonition.Button>
      </Admonition.Row>
    </Admonition.Outer>
  )
}
