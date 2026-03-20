import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {LayoutAnimation, TextInput, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useListConvosQuery} from '#/state/queries/messages/list-conversations'
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useSession} from '#/state/session'
import {type ListMethods} from '#/view/com/util/List'
import {android, atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {canBeMessaged} from '#/components/dms/util'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroup} from '#/components/icons/Person'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'

type NewGroupChatItem = {
  type: 'newGroupChat'
  key: string
}

type LabelItem = {
  type: 'label'
  key: string
  message: string
}

export type ProfileItem = {
  type: 'profile'
  key: string
  profile: bsky.profile.AnyProfileView
}

type EmptyItem = {
  type: 'empty'
  key: string
  message: string
}

type PlaceholderItem = {
  type: 'placeholder'
  key: string
}

type ErrorItem = {
  type: 'error'
  key: string
}

type Item =
  | NewGroupChatItem
  | LabelItem
  | ProfileItem
  | EmptyItem
  | PlaceholderItem
  | ErrorItem

enum ChatState {
  NEW_CHAT,
  NEW_GROUP_CHAT,
  GROUP_NAME,
}

export function InitiateChatFlow({
  title,
  showRecentConvos,
  onSelectChat,
  renderProfileCard,
}: {
  title: string
  showRecentConvos?: boolean
} & (
  | {
      renderProfileCard: (item: ProfileItem) => React.ReactNode
      onSelectChat?: undefined
    }
  | {
      onSelectChat: (did: string) => void
      renderProfileCard?: undefined
    }
)) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const control = Dialog.useDialogContext()
  const [headerHeight, setHeaderHeight] = useState(0)
  const listRef = useRef<ListMethods>(null)
  const {currentAccount} = useSession()
  const inputRef = useRef<TextInput>(null)

  const [searchText, setSearchText] = useState('')

  const {
    data: results,
    isError,
    isFetching,
  } = useActorAutocompleteQuery(searchText, true, 12)
  const {data: follows} = useProfileFollowsQuery(currentAccount?.did)
  const {data: convos} = useListConvosQuery({
    enabled: showRecentConvos,
    status: 'accepted',
  })

  const [chatState, setChatState] = useState(ChatState.NEW_CHAT)
  const [chatTitle, setChatTitle] = useState(title)

  const items = useMemo(() => {
    let _items: Item[] = []

    if (isError) {
      _items.push({
        type: 'empty',
        key: 'empty',
        message: l`We're having network issues, try again`,
      })
    } else if (searchText.length) {
      if (results?.length) {
        for (const profile of results) {
          if (profile.did === currentAccount?.did) continue
          _items.push({
            type: 'profile',
            key: profile.did,
            profile,
          })
        }

        _items = _items.sort(item => {
          return item.type === 'profile' && canBeMessaged(item.profile) ? -1 : 1
        })
      }
    } else {
      const placeholders: Item[] = Array(10)
        .fill(0)
        .map((__, i) => ({
          type: 'placeholder',
          key: i + '',
        }))

      if (showRecentConvos) {
        if (convos && follows) {
          const usedDids = new Set()

          for (const page of convos.pages) {
            for (const convo of page.convos) {
              const profiles = convo.members.filter(
                m => m.did !== currentAccount?.did,
              )

              for (const profile of profiles) {
                if (usedDids.has(profile.did)) continue

                usedDids.add(profile.did)

                _items.push({
                  type: 'profile',
                  key: profile.did,
                  profile,
                })
              }
            }
          }

          let followsItems: ProfileItem[] = []

          for (const page of follows.pages) {
            for (const profile of page.follows) {
              if (usedDids.has(profile.did)) continue

              followsItems.push({
                type: 'profile',
                key: profile.did,
                profile,
              })
            }
          }

          // only sort follows
          followsItems = followsItems.sort(item => {
            return canBeMessaged(item.profile) ? -1 : 1
          })

          // then append
          _items.push(...followsItems)
        } else {
          _items.push(...placeholders)
        }
      } else if (follows) {
        for (const page of follows.pages) {
          for (const profile of page.follows) {
            _items.push({
              type: 'profile',
              key: profile.did,
              profile,
            })
          }
        }

        _items = _items.sort(item => {
          return item.type === 'profile' && canBeMessaged(item.profile) ? -1 : 1
        })
      } else {
        _items.push(...placeholders)
      }
    }

    if (
      searchText === '' &&
      (chatState === ChatState.NEW_CHAT ||
        chatState === ChatState.NEW_GROUP_CHAT)
    ) {
      _items.unshift({
        type: 'label',
        key: 'suggested',
        message: l`Suggested`,
      })
    }

    if (chatState === ChatState.NEW_CHAT) {
      _items.unshift({type: 'newGroupChat', key: 'newGroupChat'})
    }

    return _items
  }, [
    l,
    chatState,
    searchText,
    results,
    isError,
    currentAccount?.did,
    follows,
    convos,
    showRecentConvos,
  ])

  if (searchText && !isFetching && !items.length && !isError) {
    items.push({type: 'empty', key: 'empty', message: l`No results`})
  }

  const handlePressBack = useCallback(() => {
    switch (chatState) {
      case ChatState.NEW_CHAT:
        control.close()
        break
      case ChatState.NEW_GROUP_CHAT:
        setChatTitle(title)
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setChatState(ChatState.NEW_CHAT)
        break
    }
  }, [chatState, control, title])

  const handlePressNewGroupChat = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setChatState(ChatState.NEW_GROUP_CHAT)
    setChatTitle(l`New group chat`)
  }, [l])

  const renderItems = useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'newGroupChat': {
          return (
            <NewGroupChatButton
              key={item.key}
              onPress={handlePressNewGroupChat}
            />
          )
        }
        case 'label': {
          return <Label key={item.key} message={item.message} />
        }
        case 'profile': {
          if (renderProfileCard) {
            return <Fragment key={item.key}>{renderProfileCard(item)}</Fragment>
          } else {
            return (
              <DefaultProfileCard
                key={item.key}
                profile={item.profile}
                moderationOpts={moderationOpts!}
                onPress={onSelectChat}
              />
            )
          }
        }
        case 'placeholder': {
          return <ProfileCardSkeleton key={item.key} />
        }
        case 'empty': {
          return <Empty key={item.key} message={item.message} />
        }
        default:
          return null
      }
    },
    [handlePressNewGroupChat, moderationOpts, onSelectChat, renderProfileCard],
  )

  useLayoutEffect(() => {
    if (IS_WEB) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  const listHeader = useMemo(() => {
    return (
      <View
        onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}
        style={[
          a.relative,
          web(a.pt_lg),
          native(a.pt_4xl),
          android({
            borderTopLeftRadius: a.rounded_md.borderRadius,
            borderTopRightRadius: a.rounded_md.borderRadius,
          }),
          a.pb_xs,
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
          ]}>
          <Button
            label={l`Back`}
            size="large"
            shape="round"
            variant="ghost"
            color="secondary"
            style={[native([a.absolute, a.z_20])]}
            onPress={handlePressBack}>
            <ButtonIcon icon={ArrowLeft} size="lg" />
          </Button>
          <Text
            style={[
              a.flex_grow,
              a.z_10,
              a.text_lg,
              a.font_bold,
              a.leading_tight,
              t.atoms.text_contrast_high,
              native(a.text_center),
              native(a.px_5xl),
            ]}>
            {chatTitle}
          </Text>
        </View>
        <View style={[web(a.pt_xs), native(a.pt_md)]}>
          <SearchInput
            inputRef={inputRef}
            value={searchText}
            onChangeText={text => {
              setSearchText(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onEscape={control.close}
          />
        </View>
      </View>
    )
  }, [
    t.atoms.border_contrast_low,
    t.atoms.bg,
    t.atoms.text_contrast_high,
    l,
    handlePressBack,
    chatTitle,
    searchText,
    control,
  ])

  return (
    <Dialog.InnerFlatList
      ref={listRef}
      data={items}
      renderItem={renderItems}
      ListHeaderComponent={listHeader}
      stickyHeaderIndices={[0]}
      keyExtractor={(item: Item) => item.key}
      style={[
        web([a.py_0, {height: '100vh', maxHeight: 600}, a.px_0]),
        native({height: '100%'}),
      ]}
      webInnerContentContainerStyle={a.py_0}
      webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
      scrollIndicatorInsets={{top: headerHeight}}
      keyboardDismissMode="on-drag"
    />
  )
}

function NewGroupChatButton({onPress}: {onPress: () => void}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const handleOnPress = () => {
    onPress()
  }

  return (
    <Button label={l`New group chat`} onPress={handleOnPress}>
      {({hovered, pressed, focused}) => (
        <View
          style={[
            a.p_lg,
            a.flex_row,
            a.flex_1,
            a.justify_between,
            a.align_center,
            a.gap_sm,
            pressed || focused || hovered ? t.atoms.bg_contrast_25 : t.atoms.bg,
          ]}>
          <View
            style={[
              a.rounded_full,
              a.justify_center,
              a.align_center,
              {
                backgroundColor: t.palette.contrast_50,
                padding: 12,
              },
            ]}>
            <PersonGroup size="md" fill={t.palette.contrast_1000} />
          </View>
          <View style={[a.flex_grow]}>
            <Text
              style={[a.text_md, a.font_medium, a.leading_snug, t.atoms.text]}>
              <Trans>New group chat</Trans>
            </Text>
          </View>
          <ChevronRight size="md" fill={t.palette.contrast_1000} />
        </View>
      )}
    </Button>
  )
}

function DefaultProfileCard({
  profile,
  moderationOpts,
  onPress,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  onPress: (did: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const enabled = canBeMessaged(profile)
  const moderation = moderateProfile(profile, moderationOpts)
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
      disabled={!enabled}
      label={l`Start chat with ${displayName}`}
      onPress={handleOnPress}>
      {({hovered, pressed, focused}) => (
        <View
          style={[
            a.flex_1,
            a.py_sm,
            a.px_lg,
            !enabled
              ? {opacity: 0.5}
              : pressed || focused || hovered
                ? t.atoms.bg_contrast_25
                : t.atoms.bg,
          ]}>
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              size={44}
              disabledPreview
            />
            <View style={[a.flex_1]}>
              <ProfileCard.Name
                profile={profile}
                moderationOpts={moderationOpts}
              />
              {enabled ? (
                <ProfileCard.Handle profile={profile} />
              ) : (
                <Text
                  style={[a.leading_snug, t.atoms.text_contrast_high]}
                  numberOfLines={2}>
                  <Trans>{handle} can't be messaged</Trans>
                </Text>
              )}
            </View>
          </ProfileCard.Header>
        </View>
      )}
    </Button>
  )
}

function ProfileCardSkeleton() {
  return (
    <View
      style={[
        a.flex_1,
        a.py_md,
        a.px_lg,
        a.gap_md,
        a.align_center,
        a.flex_row,
      ]}>
      <ProfileCard.AvatarPlaceholder size={42} />
      <ProfileCard.NameAndHandlePlaceholder />
    </View>
  )
}

function Label({message}: {message: string}) {
  const t = useTheme()
  return (
    <View style={[a.px_lg, a.py_sm]}>
      <Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_high]}>
        {message}
      </Text>
    </View>
  )
}

function Empty({message}: {message: string}) {
  const t = useTheme()
  return (
    <View style={[a.p_lg, a.py_xl, a.align_center, a.gap_md]}>
      <Text style={[a.text_sm, a.italic, t.atoms.text_contrast_high]}>
        {message}
      </Text>

      <Text style={[a.text_xs, t.atoms.text_contrast_low]}>(╯°□°)╯︵ ┻━┻</Text>
    </View>
  )
}

function SearchInput({
  value,
  onChangeText,
  onEscape,
  inputRef,
}: {
  value: string
  onChangeText: (text: string) => void
  onEscape: () => void
  inputRef: React.RefObject<TextInput | null>
}) {
  const t = useTheme()
  const {t: l} = useLingui()
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
        // @ts-ignore bottom sheet input types issue - esb
        ref={inputRef}
        placeholder={l`Search for people`}
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
        accessibilityLabel={l`Search profiles`}
        accessibilityHint={l`Searches for profiles`}
      />
    </View>
  )
}
