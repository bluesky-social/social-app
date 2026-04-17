import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import {LayoutAnimation, type TextInput, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

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
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'
import {IS_NATIVE, IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'
import {ChatProfileTabs} from './ChatProfileTabs'
import {EmptyMemberList} from './components/EmptyMemberList'
import {GroupChatProfileCard} from './components/GroupChatProfileCard'
import {ProfileCardSkeleton} from './components/ProfileCardSkeleton'
import {UserLabel} from './components/UserLabel'
import {UserSearchInput} from './components/UserSearchInput'

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
          return <UserLabel key={item.key} message={item.message} />
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
          return <EmptyMemberList key={item.key} message={item.message} />
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
            <UserSearchInput
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
