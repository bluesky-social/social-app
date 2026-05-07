import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {LayoutAnimation, type TextInput, View} from 'react-native'
import {moderateProfile, type ModerationOpts} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useSession} from '#/state/session'
import {type ListMethods} from '#/view/com/util/List'
import {android, atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {canBeMessaged} from '#/components/dms/util'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {
  ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon,
  ArrowRight_Stroke2_Corner0_Rounded as ArrowRightIcon,
} from '#/components/icons/Arrow'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon} from '#/components/icons/Chevron'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'
import {ChatProfileTabs} from './ChatProfileTabs'
import {EmptyMemberList} from './components/EmptyMemberList'
import {GroupChatProfileCard} from './components/GroupChatProfileCard'
import {ProfileCardSkeleton} from './components/ProfileCardSkeleton'
import {UserLabel} from './components/UserLabel'
import {UserSearchInput} from './components/UserSearchInput'

type NewGroupChatItem = {
  type: 'newGroupChat'
  key: string
}

type LabelItem = {
  type: 'label'
  key: string
  message: string
}

type ProfileItem = {
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

export type State = {
  chatState: ChatState
  screenTitle: string
  groupChatDids: string[]
  groupChatProfiles: bsky.profile.AnyProfileView[]
  groupName: string
}

export type Action =
  | {
      type: 'startNewGroupChat'
      screenTitle: string
    }
  | {
      type: 'setDids'
      groupChatDids: string[]
      groupChatProfiles: bsky.profile.AnyProfileView[]
    }
  | {
      type: 'removeDids'
      groupChatDids: string[]
      groupChatProfiles: bsky.profile.AnyProfileView[]
    }
  | {
      type: 'startNameGroup'
      screenTitle: string
    }
  | {
      type: 'nameGroup'
      groupName: string
    }
  | {
      type: 'goBackFromNewGroupChat'
      screenTitle: string
    }
  | {
      type: 'goBackFromGroupName'
      screenTitle: string
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'startNewGroupChat': {
      return {
        ...state,
        chatState: ChatState.NEW_GROUP_CHAT,
        screenTitle: action.screenTitle,
        groupChatDids: [],
        groupChatProfiles: [],
        groupName: '',
      }
    }
    case 'setDids': {
      return {
        ...state,
        groupChatDids: action.groupChatDids,
        groupChatProfiles: action.groupChatProfiles,
      }
    }
    case 'removeDids': {
      return {
        ...state,
        groupChatDids: action.groupChatDids,
        groupChatProfiles: action.groupChatProfiles,
      }
    }
    case 'startNameGroup': {
      return {
        ...state,
        chatState: ChatState.GROUP_NAME,
        screenTitle: action.screenTitle,
      }
    }
    case 'nameGroup': {
      return {
        ...state,
        groupName: action.groupName,
      }
    }
    case 'goBackFromNewGroupChat': {
      return {
        ...state,
        chatState: ChatState.NEW_CHAT,
        screenTitle: action.screenTitle,
        groupChatDids: [],
        groupChatProfiles: [],
        groupName: '',
      }
    }
    case 'goBackFromGroupName': {
      return {
        ...state,
        chatState: ChatState.NEW_GROUP_CHAT,
        screenTitle: action.screenTitle,
        groupName: '',
      }
    }
  }
}

export function InitiateChatFlow({
  title,
  onSelectChat,
  onSelectGroupChat,
}: {
  title: string
  onSelectChat: (did: string) => void
  onSelectGroupChat: (dids: string[], groupName: string) => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const moderationOpts = useModerationOpts()
  const control = Dialog.useDialogContext()
  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)
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

  const [
    {chatState, screenTitle, groupChatDids, groupChatProfiles, groupName},
    dispatch,
  ] = useReducer(reducer, {
    chatState: ChatState.NEW_CHAT,
    screenTitle: title,
    groupChatDids: [],
    groupChatProfiles: [],
    groupName: '',
  })

  const newGroupChatTitle = l`New group chat`
  const groupNameTitle = l`Group name`

  const onRemoveDid = useCallback(
    (did: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      dispatch({
        type: 'removeDids',
        groupChatDids: groupChatDids.filter(d => d !== did),
        groupChatProfiles: groupChatProfiles.filter(
          profile => profile.did !== did,
        ),
      })
    },
    [groupChatDids, groupChatProfiles],
  )

  const items = useMemo(() => {
    let _items: Item[] = []

    if (isError) {
      _items.push({
        type: 'empty',
        key: 'empty',
        message: l`We’re having network issues, try again`,
      })
    } else if (chatState === ChatState.GROUP_NAME) {
      _items = groupChatProfiles.map(profile => ({
        type: 'profile',
        key: profile.did,
        profile,
      }))
      _items.unshift({
        type: 'label',
        key: 'members',
        message: l`New group chat with:`,
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

      if (follows) {
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

    if (chatState === ChatState.NEW_CHAT && searchText === '') {
      _items.unshift({type: 'newGroupChat', key: 'newGroupChat'})
    }

    return _items
  }, [
    isError,
    chatState,
    searchText,
    l,
    groupChatProfiles,
    results,
    currentAccount?.did,
    follows,
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        dispatch({type: 'goBackFromNewGroupChat', screenTitle: title})
        setSearchText('')
        break
      case ChatState.GROUP_NAME:
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        dispatch({type: 'goBackFromGroupName', screenTitle: newGroupChatTitle})
        break
    }
  }, [chatState, control, newGroupChatTitle, title])

  const handlePressNewGroupChat = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    dispatch({type: 'startNewGroupChat', screenTitle: newGroupChatTitle})
  }, [newGroupChatTitle])

  const handlePressNext = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    dispatch({type: 'startNameGroup', screenTitle: groupNameTitle})
    setSearchText('')
  }, [groupNameTitle])

  const handlePressConfirm = useCallback(() => {
    onSelectGroupChat(groupChatDids, groupName)
  }, [groupChatDids, groupName, onSelectGroupChat])

  const setGroupName = (newGroupName: string) => {
    dispatch({type: 'nameGroup', groupName: newGroupName})
  }

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
          return <UserLabel key={item.key} message={item.message} />
        }
        case 'profile': {
          switch (chatState) {
            case ChatState.NEW_CHAT:
              return (
                <DefaultProfileCard
                  key={item.key}
                  profile={item.profile}
                  moderationOpts={moderationOpts!}
                  onPress={onSelectChat}
                />
              )
            case ChatState.NEW_GROUP_CHAT:
              return (
                <GroupChatProfileCard
                  key={item.key}
                  profile={item.profile}
                  moderationOpts={moderationOpts!}
                />
              )
            case ChatState.GROUP_NAME:
              return (
                <GroupChatMemberProfileCard
                  key={item.key}
                  profile={item.profile}
                  moderationOpts={moderationOpts!}
                />
              )
          }
        }
        case 'placeholder': {
          return <ProfileCardSkeleton key={item.key} />
        }
        case 'empty': {
          return <EmptyMemberList key={item.key} message={item.message} />
        }
        default:
          return null
      }
    },
    [chatState, handlePressNewGroupChat, moderationOpts, onSelectChat],
  )

  useLayoutEffect(() => {
    if (IS_WEB) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  let buttonLabel = l`Continue to group name`
  let buttonText = l`Next`
  let handleButtonPress = handlePressNext
  let showButton =
    chatState === ChatState.NEW_GROUP_CHAT && groupChatProfiles.length > 0
  let isButtonDisabled = !showButton
  switch (chatState) {
    case ChatState.GROUP_NAME:
      buttonLabel = l`Create group chat`
      buttonText = l`Create`
      handleButtonPress = handlePressConfirm
      showButton = true
      isButtonDisabled = groupName === ''
      break
  }

  const showChatProfileTabs =
    chatState === ChatState.NEW_GROUP_CHAT && groupChatProfiles.length > 0

  const listHeader = useMemo(
    () => (
      <View onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}>
        <View
          style={[
            a.relative,
            web(a.pt_lg),
            native(a.pt_4xl),
            android({
              borderTopLeftRadius: a.rounded_md.borderRadius,
              borderTopRightRadius: a.rounded_md.borderRadius,
            }),
            a.px_lg,
            chatState !== ChatState.GROUP_NAME ? a.pb_xs : a.pb_lg,
            chatState !== ChatState.GROUP_NAME && a.border_b,
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
                onPress={handlePressBack}>
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
              {screenTitle}
            </Text>
            {IS_WEB ? (
              <Button
                label={l`Close`}
                size="small"
                shape="round"
                variant="ghost"
                color="secondary"
                style={[a.absolute, a.z_20, {right: -4}]}
                onPress={() => control.close()}>
                <ButtonIcon icon={XIcon} size="lg" />
              </Button>
            ) : showButton ? (
              <Button
                label={buttonLabel}
                size="small"
                color="primary"
                style={[
                  native([
                    a.absolute,
                    a.z_20,
                    {
                      right: 8,
                    },
                  ]),
                ]}
                disabled={isButtonDisabled}
                onPress={handleButtonPress}>
                <ButtonText>{buttonText}</ButtonText>
              </Button>
            ) : null}
          </View>
          <View style={[web(a.pt_xs), native(a.pt_md)]}>
            {chatState === ChatState.GROUP_NAME ? (
              <View
                style={[a.w_full, a.relative, web(a.pt_md), native(a.pt_xl)]}>
                <TextField.Root>
                  <TextField.Input
                    label={l`Group name`}
                    value={groupName}
                    returnKeyType="next"
                    keyboardAppearance={t.scheme}
                    selectTextOnFocus={IS_NATIVE}
                    autoFocus={false}
                    accessibilityRole="text"
                    autoCorrect={false}
                    autoComplete="off"
                    autoCapitalize="none"
                    onChangeText={setGroupName}
                    onSubmitEditing={
                      isButtonDisabled ? undefined : handleButtonPress
                    }
                  />
                </TextField.Root>
              </View>
            ) : (
              <UserSearchInput
                inputRef={inputRef}
                value={searchText}
                onChangeText={text => {
                  setSearchText(text)
                  listRef.current?.scrollToOffset({offset: 0, animated: false})
                }}
                onEscape={control.close}
              />
            )}
          </View>
        </View>
        {showChatProfileTabs ? (
          <View style={[a.pb_sm, a.pt_md, t.atoms.bg]}>
            <ChatProfileTabs
              testID="newGroupChatMembers"
              profiles={groupChatProfiles}
              onRemove={onRemoveDid}
            />
          </View>
        ) : null}
      </View>
    ),
    [
      chatState,
      t.atoms.border_contrast_low,
      t.atoms.bg,
      t.atoms.text_contrast_high,
      t.scheme,
      l,
      handlePressBack,
      screenTitle,
      showButton,
      buttonLabel,
      isButtonDisabled,
      handleButtonPress,
      buttonText,
      groupName,
      searchText,
      control,
      showChatProfileTabs,
      groupChatProfiles,
      onRemoveDid,
    ],
  )

  const setGroupChatMembers = (dids: string[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

    const added = dids.filter(d => !groupChatDids.includes(d))
    const removed = groupChatDids.filter(d => !dids.includes(d))
    const newDids = [
      ...groupChatDids.filter(d => !removed.includes(d)),
      ...added,
    ]

    const kept = groupChatProfiles.filter(p => dids.includes(p.did))
    const keptDids = new Set(kept.map(p => p.did))
    const addedProfiles = items
      .filter(
        (item): item is ProfileItem =>
          item.type === 'profile' &&
          dids.includes(item.profile.did) &&
          !keptDids.has(item.profile.did),
      )
      .map(item => item.profile)
      .sort((a, b) => dids.indexOf(a.did) - dids.indexOf(b.did))

    dispatch({
      type: 'setDids',
      groupChatDids: newDids,
      groupChatProfiles: [...kept, ...addedProfiles],
    })
  }

  return (
    <Toggle.Group
      values={groupChatDids}
      onChange={setGroupChatMembers}
      type="checkbox"
      label={
        chatState === ChatState.NEW_GROUP_CHAT
          ? l`Select group chat members`
          : l`Start chat`
      }
      style={web([a.contents])}>
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
        webInnerContentContainerStyle={[a.py_0, {paddingBottom: footerHeight}]}
        webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
        scrollIndicatorInsets={{top: headerHeight, bottom: footerHeight}}
        keyboardDismissMode="on-drag"
        footer={
          IS_WEB && chatState !== ChatState.NEW_CHAT ? (
            <Dialog.FlatListFooter
              onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}>
              <View style={[a.flex_row, a.align_center, a.justify_between]}>
                <Button
                  label={l`Back`}
                  size="small"
                  color="secondary"
                  onPress={handlePressBack}>
                  <ButtonIcon icon={ArrowLeftIcon} size="md" />
                  <ButtonText>
                    {' '}
                    <Trans>Back</Trans>
                  </ButtonText>
                </Button>
                <Button
                  label={buttonLabel}
                  size="small"
                  color="primary"
                  disabled={isButtonDisabled}
                  onPress={handleButtonPress}>
                  <ButtonText>{buttonText} </ButtonText>
                  {chatState !== ChatState.GROUP_NAME ? (
                    <ButtonIcon icon={ArrowRightIcon} size="md" />
                  ) : null}
                </Button>
              </View>
            </Dialog.FlatListFooter>
          ) : null
        }
      />
    </Toggle.Group>
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
            a.px_lg,
            a.py_md,
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
            <PersonGroupIcon size="md" fill={t.palette.contrast_1000} />
          </View>
          <View style={[a.flex_grow]}>
            <Text
              style={[a.text_md, a.font_medium, a.leading_snug, t.atoms.text]}>
              <Trans>New group chat</Trans>
            </Text>
          </View>
          <ChevronRightIcon size="md" fill={t.palette.contrast_1000} />
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
                  <Trans>{handle} can’t be messaged</Trans>
                </Text>
              )}
            </View>
          </ProfileCard.Header>
        </View>
      )}
    </Button>
  )
}

function GroupChatMemberProfileCard({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const enabled = canBeMessaged(profile)
  const handle = sanitizeHandle(profile.handle, '@')

  return (
    <View style={[a.flex_1, a.py_sm, a.px_lg, t.atoms.bg]}>
      <ProfileCard.Header>
        <ProfileCard.Avatar
          profile={profile}
          moderationOpts={moderationOpts}
          size={44}
          disabledPreview
        />
        <View style={[a.flex_1]}>
          <ProfileCard.Name profile={profile} moderationOpts={moderationOpts} />
          {enabled ? (
            <ProfileCard.Handle profile={profile} />
          ) : (
            <Text
              style={[a.leading_snug, t.atoms.text_contrast_high]}
              numberOfLines={2}>
              <Trans>{handle} can’t be messaged</Trans>
            </Text>
          )}
        </View>
      </ProfileCard.Header>
    </View>
  )
}
