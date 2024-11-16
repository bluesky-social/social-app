import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {TextInput, View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useListConvosQuery} from '#/state/queries/messages/list-converations'
import {useProfileFollowsQuery} from '#/state/queries/profile-follows'
import {useSession} from '#/state/session'
import {ListMethods} from '#/view/com/util/List'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {canBeMessaged} from '#/components/dms/util'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

type Item =
  | {
      type: 'profile'
      key: string
      enabled: boolean
      profile: AppBskyActorDefs.ProfileView
    }
  | {
      type: 'empty'
      key: string
      message: string
    }
  | {
      type: 'placeholder'
      key: string
    }
  | {
      type: 'error'
      key: string
    }

export function SearchablePeopleList({
  title,
  onSelectChat,
  showRecentConvos,
}: {
  title: string
  onSelectChat: (did: string) => void
  showRecentConvos?: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const control = Dialog.useDialogContext()
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
  const {data: convos} = useListConvosQuery({enabled: showRecentConvos})

  const items = useMemo(() => {
    let _items: Item[] = []

    if (isError) {
      _items.push({
        type: 'empty',
        key: 'empty',
        message: _(msg`We're having network issues, try again`),
      })
    } else if (searchText.length) {
      if (results?.length) {
        for (const profile of results) {
          if (profile.did === currentAccount?.did) continue
          _items.push({
            type: 'profile',
            key: profile.did,
            enabled: canBeMessaged(profile),
            profile,
          })
        }

        _items = _items.sort(item => {
          // @ts-ignore
          return item.enabled ? -1 : 1
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
                  enabled: true,
                  profile,
                })
              }
            }
          }

          let followsItems: typeof _items = []

          for (const page of follows.pages) {
            for (const profile of page.follows) {
              if (usedDids.has(profile.did)) continue

              followsItems.push({
                type: 'profile',
                key: profile.did,
                enabled: canBeMessaged(profile),
                profile,
              })
            }
          }

          // only sort follows
          followsItems = followsItems.sort(item => {
            // @ts-ignore
            return item.enabled ? -1 : 1
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
              enabled: canBeMessaged(profile),
              profile,
            })
          }
        }

        _items = _items.sort(item => {
          // @ts-ignore
          return item.enabled ? -1 : 1
        })
      } else {
        _items.push(...placeholders)
      }
    }

    return _items
  }, [
    _,
    searchText,
    results,
    isError,
    currentAccount?.did,
    follows,
    convos,
    showRecentConvos,
  ])

  if (searchText && !isFetching && !items.length && !isError) {
    items.push({type: 'empty', key: 'empty', message: _(msg`No results`)})
  }

  const renderItems = useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'profile': {
          return (
            <ProfileCard
              key={item.key}
              enabled={item.enabled}
              profile={item.profile}
              moderationOpts={moderationOpts!}
              onPress={onSelectChat}
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
    [moderationOpts, onSelectChat],
  )

  useLayoutEffect(() => {
    if (isWeb) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  const listHeader = useMemo(() => {
    return (
      <View
        style={[
          a.relative,
          web(a.pt_lg),
          native(a.pt_4xl),
          a.pb_xs,
          a.px_lg,
          a.border_b,
          t.atoms.border_contrast_low,
          t.atoms.bg,
        ]}>
        <View style={[a.relative, native(a.align_center), a.justify_center]}>
          <Text
            style={[
              a.z_10,
              a.text_lg,
              a.font_heavy,
              a.leading_tight,
              t.atoms.text_contrast_high,
            ]}>
            {title}
          </Text>
          {isWeb ? (
            <Button
              label={_(msg`Close`)}
              size="small"
              shape="round"
              variant={isWeb ? 'ghost' : 'solid'}
              color="secondary"
              style={[
                a.absolute,
                a.z_20,
                web({right: -4}),
                native({right: 0}),
                native({height: 32, width: 32, borderRadius: 16}),
              ]}
              onPress={() => control.close()}>
              <ButtonIcon icon={X} size="md" />
            </Button>
          ) : null}
        </View>

        <View style={web([a.pt_xs])}>
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
    _,
    title,
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
      keyboardDismissMode="on-drag"
    />
  )
}

function ProfileCard({
  enabled,
  profile,
  moderationOpts,
  onPress,
}: {
  enabled: boolean
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  onPress: (did: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
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
            !enabled
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
              style={[t.atoms.text, a.font_bold, a.leading_tight, a.self_start]}
              numberOfLines={1}
              emoji>
              {displayName}
            </Text>
            <Text
              style={[a.leading_tight, t.atoms.text_contrast_high]}
              numberOfLines={2}>
              {!enabled ? <Trans>{handle} can't be messaged</Trans> : handle}
            </Text>
          </View>
        </View>
      )}
    </Button>
  )
}

function ProfileCardSkeleton() {
  const t = useTheme()

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
      <View
        style={[
          a.rounded_full,
          {width: 42, height: 42},
          t.atoms.bg_contrast_25,
        ]}
      />

      <View style={[a.flex_1, a.gap_sm]}>
        <View
          style={[
            a.rounded_xs,
            {width: 80, height: 14},
            t.atoms.bg_contrast_25,
          ]}
        />
        <View
          style={[
            a.rounded_xs,
            {width: 120, height: 10},
            t.atoms.bg_contrast_25,
          ]}
        />
      </View>
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
  inputRef: React.RefObject<TextInput>
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
        // @ts-ignore bottom sheet input types issue — esb
        ref={inputRef}
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
