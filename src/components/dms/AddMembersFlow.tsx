import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
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
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useSession} from '#/state/session'
import {type ListMethods} from '#/view/com/util/List'
import {android, atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {canBeMessaged} from '#/components/dms/util'
import * as Toggle from '#/components/forms/Toggle'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'
import {ChatProfileTabs} from './ChatProfileTabs'

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

type Item = LabelItem | ProfileItem | EmptyItem | PlaceholderItem | ErrorItem

export type State = {
  groupChatDids: string[]
  groupChatProfiles: bsky.profile.AnyProfileView[]
}

export type Action =
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

function reducer(state: State, action: Action): State {
  switch (action.type) {
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
  }
}
export function AddMembersFlow({
  title,
  onAddMembers,
}: {
  title: string
  onAddMembers: (dids: string[]) => void
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

  const [{groupChatDids, groupChatProfiles}, dispatch] = useReducer(reducer, {
    groupChatDids: [],
    groupChatProfiles: [],
  })

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

    if (searchText === '') {
      _items.unshift({
        type: 'label',
        key: 'suggested',
        message: l`Suggested`,
      })
    }

    return _items
  }, [isError, searchText, l, results, currentAccount?.did, follows])

  if (searchText && !isFetching && !items.length && !isError) {
    items.push({type: 'empty', key: 'empty', message: l`No results`})
  }

  const handlePressBack = useCallback(() => {
    control.close()
  }, [control])

  const handlePressAdd = useCallback(() => {
    onAddMembers(groupChatDids)
  }, [groupChatDids, onAddMembers])

  const renderItems = useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'label': {
          return <Label key={item.key} message={item.message} />
        }
        case 'profile': {
          return (
            <GroupChatProfileCard
              key={item.key}
              profile={item.profile}
              moderationOpts={moderationOpts!}
            />
          )
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
    [moderationOpts],
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
  let showButton = groupChatProfiles.length > 0
  let isButtonDisabled = !showButton

  const showChatProfileTabs = groupChatProfiles.length > 0

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
            a.pb_lg,
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
              {title}
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
                onPress={handlePressAdd}>
                <ButtonText>
                  <Trans>Add</Trans>
                </ButtonText>
              </Button>
            ) : null}
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
      buttonLabel,
      control,
      groupChatProfiles,
      handlePressAdd,
      handlePressBack,
      isButtonDisabled,
      l,
      onRemoveDid,
      searchText,
      showButton,
      showChatProfileTabs,
      t.atoms.bg,
      t.atoms.border_contrast_low,
      t.atoms.text_contrast_high,
      title,
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
      label={l`Add group chat members`}
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
          IS_WEB ? (
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
                  onPress={handlePressAdd}>
                  <ButtonText>{buttonText} </ButtonText>
                </Button>
              </View>
            </Dialog.FlatListFooter>
          ) : null
        }
      />
    </Toggle.Group>
  )
}

function GroupChatProfileCard({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  const t = useTheme()
  const enabled = canBeMessaged(profile)
  const moderation = moderateProfile(profile, moderationOpts)
  const handle = sanitizeHandle(profile.handle, '@')
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  return (
    <Toggle.Item
      key={profile.did}
      disabled={!enabled}
      name={profile.did}
      label={displayName}
      style={[a.flex_1, a.py_sm, a.px_lg]}>
      <View style={[a.flex_grow, !enabled ? {opacity: 0.5} : null]}>
        <ProfileCard.Header>
          <ProfileCard.Avatar
            profile={profile}
            moderationOpts={moderationOpts}
            size={44}
            disabledPreview
          />
          <View>
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
      {enabled ? <Toggle.Checkbox /> : null}
    </Toggle.Item>
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
      <SearchIcon
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
