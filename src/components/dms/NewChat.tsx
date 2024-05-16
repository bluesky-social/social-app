import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Keyboard, TextInput, View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {BottomSheetFlatListMethods} from '@discord/bottom-sheet'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useGetConvoForMembers} from '#/state/queries/messages/get-convo-for-members'
import {useSession} from '#/state/session'
import {useActorAutocompleteQuery} from 'state/queries/actor-autocomplete'
import {FAB} from '#/view/com/util/fab/FAB'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeft} from '#/components/icons/Chevron'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Button} from '../Button'
import {Text} from '../Typography'
import {canBeMessaged} from './util'

type Item =
  | {
      type: 'profile'
      key: string
      profile: AppBskyActorDefs.ProfileView
    }
  | {
      type: 'empty'
      key: string
    }
  | {
      type: 'error'
      key: string
    }

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
        <SearchablePeopleList onCreateChat={onCreateChat} />
      </Dialog.Outer>
    </>
  )
}

function ProfileCard({
  profile,
  moderationOpts,
  onPress,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  onPress: (did: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderation = moderateProfile(profile, moderationOpts)
  const disabled = !canBeMessaged(profile)
  const handle = sanitizeHandle(profile.handle, '@')
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  const handleOnPress = useCallback(() => {
    onPress(profile.did)
  }, [onPress, profile.did])

  return (
    <Button
      disabled={disabled}
      label={_(msg`Start chat with ${displayName}`)}
      onPress={handleOnPress}>
      {({hovered, pressed, focused}) => (
        <View
          style={[
            a.flex_1,
            a.py_md,
            a.px_lg,
            a.gap_md,
            a.align_center,
            a.flex_row,
            disabled
              ? {opacity: 0.5}
              : pressed || focused
              ? t.atoms.bg_contrast_25
              : hovered
              ? t.atoms.bg_contrast_50
              : t.atoms.bg,
          ]}>
          <UserAvatar
            size={42}
            avatar={profile.avatar}
            moderation={moderation.ui('avatar')}
            type={profile.associated?.labeler ? 'labeler' : 'user'}
          />
          <View style={[a.flex_1, a.gap_2xs]}>
            <Text
              style={[t.atoms.text, a.font_bold, a.leading_snug]}
              numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={t.atoms.text_contrast_high} numberOfLines={2}>
              {disabled ? <Trans>{handle} can't be messaged</Trans> : handle}
            </Text>
          </View>
        </View>
      )}
    </Button>
  )
}

function Empty() {
  const t = useTheme()
  return (
    <View style={[a.p_lg, a.py_xl, a.align_center, a.gap_md]}>
      <Text style={[a.text_sm, a.italic, t.atoms.text_contrast_high]}>
        No results
      </Text>

      <Text style={[a.text_xs, t.atoms.text_contrast_low]}>(╯°□°)╯︵ ┻━┻</Text>
    </View>
  )
}

function SearchInput({
  value,
  onChangeText,
  onEscape,
}: {
  value: string
  onChangeText: (text: string) => void
  onEscape: () => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {
    state: hovered,
    onIn: onMouseEnter,
    onOut: onMouseLeave,
  } = useInteractionState()
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()
  const interacted = hovered || focused

  return (
    <View
      {...web({
        onMouseEnter,
        onMouseLeave,
      })}
      style={[a.flex_row, a.align_center, a.gap_sm]}>
      <Search
        size="md"
        fill={interacted ? t.palette.primary_500 : t.palette.contrast_300}
      />

      <TextInput
        placeholder={_(msg`Search`)}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        style={[a.flex_1, a.py_md, a.text_md, t.atoms.text]}
        placeholderTextColor={t.palette.contrast_500}
        keyboardAppearance={t.name === 'light' ? 'light' : 'dark'}
        returnKeyType="search"
        clearButtonMode="while-editing"
        maxLength={50}
        onKeyPress={({nativeEvent}) => {
          if (nativeEvent.key === 'Escape') {
            onEscape()
          }
        }}
        autoCorrect={false}
        autoComplete="off"
        autoCapitalize="none"
        autoFocus
        accessibilityLabel={_(msg`Search profiles`)}
        accessibilityHint={_(msg`Search profiles`)}
      />
    </View>
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
  const {currentAccount} = useSession()

  const [searchText, setSearchText] = useState('')

  const {data: results, isError} = useActorAutocompleteQuery(searchText, true)

  const items = React.useMemo(() => {
    const i: Item[] = []

    if (isError) {
      i.push({type: 'error', key: 'error'})
    } else if (searchText.length) {
      if (results?.length) {
        for (const profile of results) {
          if (profile.did === currentAccount?.did) continue
          i.push({type: 'profile', key: profile.did, profile})
        }
      } else {
        i.push({type: 'empty', key: 'empty'})
      }
    } else {
      console.log('empty')
    }

    return i
  }, [searchText, results, isError, currentAccount?.did])

  const renderItems = React.useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'profile': {
          return (
            <ProfileCard
              key={item.key}
              profile={item.profile}
              moderationOpts={moderationOpts!}
              onPress={onCreateChat}
            />
          )
        }
        case 'empty': {
          return <Empty key={item.key} />
        }
        default:
          return null
      }
    },
    [moderationOpts, onCreateChat],
  )

  const listHeader = useMemo(() => {
    return (
      <View
        style={[
          a.relative,
          a.px_lg,
          a.border_b,
          t.atoms.border_contrast_low,
          t.atoms.bg,
        ]}>
        <View
          style={[
            a.relative,
            native(a.align_center),
            a.justify_center,
            {height: 32},
          ]}>
          <Text
            style={[
              a.z_10,
              a.text_lg,
              a.font_bold,
              a.leading_tight,
              t.atoms.text_contrast_high,
            ]}>
            <Trans>Start a new chat</Trans>
          </Text>
        </View>

        <View style={[native([a.pt_md])]}>
          <SearchInput
            value={searchText}
            onChangeText={text => {
              setSearchText(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onEscape={control.close}
          />
        </View>

        <Button
          label={_(msg`Close`)}
          size="small"
          shape="round"
          variant="ghost"
          color="secondary"
          style={[
            a.absolute,
            a.z_20,
            native({
              left: a.px_lg.paddingLeft - 4,
            }),
            web({
              right: a.px_lg.paddingLeft - 4,
            }),
          ]}
          onPress={() => control.close()}>
          {isWeb ? (
            <X size="md" fill={t.palette.contrast_500} />
          ) : (
            <ChevronLeft size="md" fill={t.palette.contrast_500} />
          )}
        </Button>
      </View>
    )
  }, [t, _, control, searchText])

  return (
    <Dialog.InnerFlatList
      ref={listRef}
      data={items}
      renderItem={renderItems}
      ListHeaderComponent={listHeader}
      stickyHeaderIndices={[0]}
      keyExtractor={(item: AppBskyActorDefs.ProfileView) => item.did}
      style={[
        web([a.py_md, {height: '100vh', maxHeight: 600}, a.px_0]),
        native({
          paddingHorizontal: 0,
          marginTop: 0,
          paddingTop: 20,
        }),
      ]}
      webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
      onScrollBeginDrag={() => Keyboard.dismiss()}
    />
  )
}
