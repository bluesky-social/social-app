import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Keyboard, View} from 'react-native'
import {AppBskyActorDefs, moderateProfile} from '@atproto/api'
import {BottomSheetFlatListMethods} from '@discord/bottom-sheet'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {useActorAutocompleteQuery} from 'state/queries/actor-autocomplete'
import {FAB} from '#/view/com/util/fab/FAB'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Button} from '../Button'
import {Envelope_Stroke2_Corner0_Rounded as Envelope} from '../icons/Envelope'
import {ListMaybePlaceholder} from '../Lists'
import {Text} from '../Typography'

export function NewChat({
  control,
  onNewChat,
}: {
  control: Dialog.DialogControlProps
  onNewChat: (chatId: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()

  const {mutate: createChat} = useGetConvoForMembers({
    onSuccess: data => {
      onNewChat(data.convo.id)
    },
    onError: error => {
      Toast.show(error.message)
    },
  })

  const onCreateChat = useCallback(
    (did: string) => {
      control.close(() => createChat([did]))
    },
    [control, createChat],
  )

  return (
    <>
      <FAB
        testID="newChatFAB"
        onPress={control.open}
        icon={<Plus size="lg" fill={t.palette.white} />}
        accessibilityRole="button"
        accessibilityLabel={_(msg`New chat`)}
        accessibilityHint=""
      />

      <Dialog.Outer
        control={control}
        testID="newChatDialog"
        nativeOptions={{sheet: {snapPoints: ['100%']}}}>
        <Dialog.Handle />
        <SearchablePeopleList onCreateChat={onCreateChat} />
      </Dialog.Outer>
    </>
  )
}

function SearchablePeopleList({
  onCreateChat,
}: {
  onCreateChat: (did: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const control = Dialog.useDialogContext()
  const listRef = useRef<BottomSheetFlatListMethods>(null)

  const [searchText, setSearchText] = useState('')

  const {
    data: actorAutocompleteData,
    isFetching,
    isError,
    refetch,
  } = useActorAutocompleteQuery(searchText, true)

  const renderItem = useCallback(
    ({item: profile}: {item: AppBskyActorDefs.ProfileView}) => {
      if (!moderationOpts) return null
      const moderation = moderateProfile(profile, moderationOpts)
      return (
        <Button
          label={profile.displayName || sanitizeHandle(profile.handle)}
          onPress={() => onCreateChat(profile.did)}>
          {({hovered, pressed}) => (
            <View
              style={[
                a.flex_1,
                a.px_md,
                a.py_sm,
                a.gap_md,
                a.align_center,
                a.flex_row,
                a.rounded_sm,
                pressed
                  ? t.atoms.bg_contrast_25
                  : hovered
                  ? t.atoms.bg_contrast_50
                  : t.atoms.bg,
              ]}>
              <UserAvatar
                size={40}
                avatar={profile.avatar}
                moderation={moderation.ui('avatar')}
                type={profile.associated?.labeler ? 'labeler' : 'user'}
              />
              <View style={{flex: 1}}>
                <Text
                  style={[t.atoms.text, a.font_bold, a.leading_snug]}
                  numberOfLines={1}>
                  {sanitizeDisplayName(
                    profile.displayName || sanitizeHandle(profile.handle),
                    moderation.ui('displayName'),
                  )}
                </Text>
                <Text style={t.atoms.text_contrast_high} numberOfLines={1}>
                  {sanitizeHandle(profile.handle, '@')}
                </Text>
              </View>
            </View>
          )}
        </Button>
      )
    },
    [
      moderationOpts,
      onCreateChat,
      t.atoms.bg_contrast_25,
      t.atoms.bg_contrast_50,
      t.atoms.bg,
      t.atoms.text,
      t.atoms.text_contrast_high,
    ],
  )

  const listHeader = useMemo(() => {
    return (
      <View style={[a.relative, a.mb_lg]}>
        {/* cover top corners */}
        <View
          style={[
            a.absolute,
            a.inset_0,
            {
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            },
            t.atoms.bg,
          ]}
        />
        <Dialog.Close />
        <Text
          style={[
            a.text_2xl,
            a.font_bold,
            a.leading_tight,
            a.pb_lg,
            web(a.pt_lg),
          ]}>
          <Trans>Start a new chat</Trans>
        </Text>
        <TextField.Root>
          <TextField.Icon icon={Search} />
          <Dialog.Input
            label={_(msg`Search profiles`)}
            placeholder={_(msg`Search`)}
            value={searchText}
            onChangeText={text => {
              setSearchText(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
            maxLength={50}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Escape') {
                control.close()
              }
            }}
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            autoFocus
          />
        </TextField.Root>
      </View>
    )
  }, [t.atoms.bg, _, control, searchText])

  return (
    <Dialog.InnerFlatList
      ref={listRef}
      data={actorAutocompleteData}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          {listHeader}
          {searchText.length === 0 ? (
            <View style={[a.pt_4xl, a.align_center, a.px_lg]}>
              <Envelope width={64} fill={t.palette.contrast_200} />
              <Text
                style={[
                  a.text_lg,
                  a.text_center,
                  a.mt_md,
                  t.atoms.text_contrast_low,
                ]}>
                <Trans>Search for someone to start a conversation with.</Trans>
              </Text>
            </View>
          ) : (
            !actorAutocompleteData?.length && (
              <ListMaybePlaceholder
                isLoading={isFetching}
                isError={isError}
                onRetry={refetch}
                hideBackButton={true}
                emptyType="results"
                sideBorders={false}
                emptyMessage={
                  isError
                    ? _(msg`No search results found for "${searchText}".`)
                    : _(msg`Could not load profiles. Please try again later.`)
                }
              />
            )
          )}
        </>
      }
      stickyHeaderIndices={[0]}
      keyExtractor={(item: AppBskyActorDefs.ProfileView) => item.did}
      // @ts-expect-error web only
      style={isWeb && {minHeight: '100vh'}}
      onScrollBeginDrag={() => Keyboard.dismiss()}
    />
  )
}
