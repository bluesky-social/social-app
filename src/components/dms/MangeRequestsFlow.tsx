import {useMemo, useRef, useState} from 'react'
import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useListJoinRequestsQuery} from '#/state/queries/messages/list-join-requests'
import {type ListMethods} from '#/view/com/util/List'
import {android, atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type ConvoWithDetails} from '#/components/dms/util'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {KnownFollowers} from '#/components/KnownFollowers'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'

export function ManageRequestsFlow({
  convo,
}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const moderationOpts = useModerationOpts()

  const control = Dialog.useDialogContext()

  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)

  const [isPTRing, setIsPTRing] = useState(false)

  const listRef = useRef<ListMethods>(null)

  const {
    data: joinRequestsData,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useListJoinRequestsQuery({
    convoId: convo.view.id,
    enabled: true,
  })

  const items =
    joinRequestsData?.pages.flatMap(page =>
      page.requests.map(request => request.requestedBy),
    ) ?? []
  const requestCount =
    joinRequestsData?.pages.reduce(
      (sum, page) => sum + page.requests.length,
      0,
    ) ?? 0

  const renderItem = ({item}: {item: bsky.profile.AnyProfileView}) => {
    if (!moderationOpts) return null
    return (
      <View style={[a.relative, a.flex_1, a.p_lg]}>
        <View style={[a.flex_row, a.align_start, a.gap_md]}>
          <View>
            <ProfileCard.Avatar
              profile={item}
              moderationOpts={moderationOpts}
              size={44}
              disabledPreview
            />
          </View>
          <View>
            <ProfileCard.Name profile={item} moderationOpts={moderationOpts} />
            <ProfileCard.Handle profile={item} />
            <View style={[a.mt_xs]}>
              <KnownFollowers
                profile={item}
                moderationOpts={moderationOpts}
                minimal
                showIfEmpty
              />
            </View>
            <View style={[a.flex_row, a.align_center, a.gap_sm, a.mt_md]}>
              <AcceptButton convo={convo} profile={item} />
              <RejectButton convo={convo} profile={item} />
            </View>
          </View>
        </View>
      </View>
    )
  }

  const listHeader = useMemo(
    () => (
      <View onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}>
        <View
          style={[
            a.relative,
            web(a.pt_lg),
            native(a.pt_4xl),
            native(a.pb_lg),
            android({
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            }),
            a.px_lg,
            a.border_b,
            t.atoms.border_contrast_low,
            t.atoms.bg,
          ]}>
          <View
            style={[
              a.flex_row,
              a.gap_sm,
              a.relative,
              a.align_center,
              a.justify_between,
              web(a.pb_lg),
            ]}>
            {IS_NATIVE ? (
              <Button
                label={l`Back`}
                size="large"
                shape="round"
                variant="ghost"
                color="secondary"
                style={[native([a.absolute, a.z_20])]}
                onPress={() => {
                  control.close()
                }}>
                <ButtonIcon icon={ArrowLeftIcon} size="lg" />
              </Button>
            ) : null}
            <Text
              style={[
                a.flex_grow,
                a.z_10,
                a.text_lg,
                a.font_bold,
                a.leading_tight,
                t.atoms.text_contrast_high,
                a.text_center,
                a.px_5xl,
              ]}>
              {requestCount > 20 ? (
                <Trans>20+ requests to join</Trans>
              ) : (
                <Plural
                  value={requestCount}
                  zero="No requests to join"
                  one="# request to join"
                  other="# requests to join"
                />
              )}
            </Text>
          </View>
        </View>
      </View>
    ),
    [
      control,
      l,
      requestCount,
      t.atoms.bg,
      t.atoms.border_contrast_low,
      t.atoms.text_contrast_high,
    ],
  )

  const onEndReached = async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more likes', {message: err})
    }
  }

  const onRefresh = async () => {
    setIsPTRing(true)
    try {
      await refetch()
    } catch (err) {
      logger.error('Failed to refresh group chat requests', {message: err})
    }
    setIsPTRing(false)
  }

  if (isError) {
    return (
      <View style={web([a.contents])}>
        <Dialog.ScrollableInner
          label={l`Requests to join`}
          contentContainerStyle={[a.h_full, a.justify_center]}>
          <View style={[a.align_center, a.gap_sm]}>
            <ErrorIcon size="3xl" fill={t.atoms.text_contrast_high.color} />
            <Text
              style={[
                a.leading_snug,
                a.text_center,
                a.px_lg,
                a.text_md,
                t.atoms.text_contrast_high,
              ]}>
              <Trans>Unable to fetch join requests.</Trans>
            </Text>
            <Button
              variant="solid"
              color="primary"
              label={l`Press to retry`}
              onPress={() => void onRefresh()}
              size="large"
              style={[a.mt_md]}>
              <ButtonText>
                <Trans>Retry</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </View>
    )
  }

  return (
    <View style={web([a.contents])}>
      <Dialog.InnerFlatList
        ref={listRef}
        data={items}
        keyExtractor={(item: bsky.profile.AnyProfileView) => item.did}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          <View style={[a.flex_1, a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        }
        style={[
          web([a.py_0, {height: '100vh', maxHeight: 600}, a.px_0]),
          native({height: '100%'}),
        ]}
        contentContainerStyle={items.length === 0 ? {flexGrow: 1} : undefined}
        webInnerContentContainerStyle={[
          a.py_0,
          {paddingBottom: footerHeight},
          items.length === 0 && {flexGrow: 1},
        ]}
        webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
        scrollIndicatorInsets={{top: headerHeight, bottom: footerHeight}}
        keyboardDismissMode="on-drag"
        footer={
          IS_WEB ? (
            <Dialog.FlatListFooter
              onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}>
              <View
                style={[a.flex_row, a.align_center, a.justify_between]}></View>
            </Dialog.FlatListFooter>
          ) : null
        }
        refreshing={isPTRing}
        onEndReached={() => void onEndReached()}
        onRefresh={() => void onRefresh()}
      />
    </View>
  )
}

function AcceptButton({}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()

  return (
    <Button
      label={l`Accept join request`}
      size="large"
      color="primary"
      onPress={() => {}}>
      <ButtonText>
        <Trans comment="Accept a request to join a chat" context="button">
          Accept
        </Trans>
      </ButtonText>
    </Button>
  )
}

function RejectButton({}: {
  convo: Extract<ConvoWithDetails, {kind: 'group'}>
  profile: bsky.profile.AnyProfileView
}) {
  const {t: l} = useLingui()

  return (
    <Button
      label={l`Ignore join request`}
      size="large"
      color="secondary"
      onPress={() => {}}>
      <ButtonText>
        <Trans comment="Ignore a request to join a chat" context="button">
          Ignore
        </Trans>
      </ButtonText>
    </Button>
  )
}
