import React from 'react'
import {TextInput,View} from 'react-native'
import {AppBskyActorDefs, moderateProfile, ModerationOpts} from '@atproto/api'
import {msg, Plural,Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {useProfilesQuery} from '#/state/queries/profile'
import {ListMethods} from '#/view/com/util/List'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native,useTheme, web} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

const AVI_SIZE = 30
const AVI_BORDER = 1

type Item =
  | {
      type: 'profile'
      key: string
      checked: boolean
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

export function UserSelectButton({
  dids,
  onChangeDids,
}: {
  dids: string[]
  onChangeDids: (dids: string[]) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const {data: profiles} = useProfilesQuery({
    handles: dids,
  })
  const moderationOpts = useModerationOpts()
  const slice =
    profiles?.profiles?.slice(0, 3).map(f => {
      if (!moderationOpts) {
        return {
          profile: {
            ...f,
            displayName: f.displayName || f.handle,
          },
          moderation: null,
        }
      }
      const moderation = moderateProfile(f, moderationOpts)
      return {
        profile: {
          ...f,
          displayName: sanitizeDisplayName(
            f.displayName || f.handle,
            moderation.ui('displayName'),
          ),
        },
        moderation,
      }
    }) || []
  const serverCount = dids.length
  const textStyle = [a.text_sm]

  return (
    <>
      <Button label={_(msg`Select users`)} onPress={control.open}>
        {ctx => (
          <View
            style={[
              a.w_full,
              a.flex_row,
              a.align_start,
              a.p_lg,
              a.border,
              a.rounded_sm,
              t.atoms.border_contrast_low,
              ctx.hovered || ctx.pressed
                ? [t.atoms.border_contrast_medium]
                : [],
            ]}>
            <View style={[a.flex_1, a.gap_xs]}>
              <Text style={[a.text_md, a.font_bold, a.leading_tight]}>
                {dids.length ? (
                  <Trans>
                    {dids.length}{' '}
                    <Plural value={dids.length} one="user" other="users" />{' '}
                    selected
                  </Trans>
                ) : (
                  <Trans>No users selected</Trans>
                )}
              </Text>
              {slice.length ? (
                <Text style={[textStyle]} numberOfLines={2}>
                  {slice.length >= 2 ? (
                    // 2-n followers, including blocks
                    serverCount > 2 ? (
                      <Trans>
                        Including{' '}
                        <Text
                          emoji
                          key={slice[0].profile.did}
                          style={textStyle}>
                          {slice[0].profile.displayName}
                        </Text>
                        ,{' '}
                        <Text
                          emoji
                          key={slice[1].profile.did}
                          style={textStyle}>
                          {slice[1].profile.displayName}
                        </Text>
                        , and{' '}
                        <Plural
                          value={serverCount - 2}
                          one="# other"
                          other="# others"
                        />
                      </Trans>
                    ) : (
                      // only 2
                      <Trans>
                        Including{' '}
                        <Text
                          emoji
                          key={slice[0].profile.did}
                          style={textStyle}>
                          {slice[0].profile.displayName}
                        </Text>{' '}
                        and{' '}
                        <Text
                          emoji
                          key={slice[1].profile.did}
                          style={textStyle}>
                          {slice[1].profile.displayName}
                        </Text>
                      </Trans>
                    )
                  ) : serverCount > 1 ? (
                    // 1-n followers, including blocks
                    <Trans>
                      Including{' '}
                      <Text emoji key={slice[0].profile.did} style={textStyle}>
                        {slice[0].profile.displayName}
                      </Text>{' '}
                      and{' '}
                      <Plural
                        value={serverCount - 1}
                        one="# other"
                        other="# others"
                      />
                    </Trans>
                  ) : (
                    // only 1
                    <Trans>
                      Including{' '}
                      <Text emoji key={slice[0].profile.did} style={textStyle}>
                        {slice[0].profile.displayName}
                      </Text>
                    </Trans>
                  )}
                </Text>
              ) : (
                <Text style={[a.text_sm, a.leading_snug]}>
                  Your feed will contain posts from all user.
                </Text>
              )}
            </View>

            <View style={[a.flex_row, a.justify_end]}>
              <View
                style={[
                  {
                    height: AVI_SIZE,
                    width: AVI_SIZE + (slice.length - 1) * a.gap_md.gap,
                  },
                ]}>
                {slice.map(({profile: prof, moderation}, i) => (
                  <View
                    key={prof.did}
                    style={[
                      a.absolute,
                      a.rounded_full,
                      {
                        borderWidth: AVI_BORDER,
                        borderColor: t.atoms.bg.backgroundColor,
                        width: AVI_SIZE + AVI_BORDER * 2,
                        height: AVI_SIZE + AVI_BORDER * 2,
                        left: i * a.gap_md.gap,
                        zIndex: AVI_BORDER - i,
                      },
                    ]}>
                    <UserAvatar
                      size={AVI_SIZE}
                      avatar={prof.avatar}
                      moderation={moderation?.ui('avatar')}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <UserSelectDialog
          control={control}
          dids={dids}
          onChangeDids={onChangeDids}
          profiles={profiles?.profiles || []}
        />
      </Dialog.Outer>
    </>
  )
}

export function UserSelectDialog({
  control,
  profiles,
  dids,
  onChangeDids,
}: {
  control: Dialog.DialogOuterProps['control']
  profiles: AppBskyActorDefs.ProfileView[]
  dids: string[]
  onChangeDids: (dids: string[]) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const listRef = React.useRef<ListMethods>(null)
  const inputRef = React.useRef<TextInput>(null)

  const [searchText, setSearchText] = React.useState('')

  const {
    data: results,
    isError,
    isFetching,
  } = useActorAutocompleteQuery(searchText, true, 12)

  const onToggleUser = React.useCallback(
    (did: string, checked: boolean) => {
      if (checked) {
        onChangeDids(Array.from(new Set([did, ...dids])))
      } else {
        onChangeDids(dids.filter(d => d !== did))
      }
    },
    [dids, onChangeDids],
  )

  const items = React.useMemo(() => {
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
          _items.push({
            type: 'profile',
            key: profile.did,
            checked: dids.includes(profile.did),
            profile,
          })
        }

        //         _items = _items.sort(item => {
        //           // @ts-ignore
        //           return item.enabled ? -1 : 1
        //         })
      }
    } else {
      if (profiles.length) {
        for (const profile of profiles) {
          _items.push({
            type: 'profile',
            key: profile.did,
            checked: dids.includes(profile.did),
            profile,
          })
        }

        // _items = _items.sort(item => {
        //   // @ts-ignore
        //   return item.checked ? -1 : 1
        // })
      } else {
        const placeholders: Item[] = Array(10)
          .fill(0)
          .map((__, i) => ({
            type: 'placeholder',
            key: i + '',
          }))
        _items.push(...placeholders)
      }
    }

    return _items
  }, [_, dids, profiles, searchText, results, isError])

  if (searchText && !isFetching && !items.length && !isError) {
    items.push({type: 'empty', key: 'empty', message: _(msg`No results`)})
  }

  const renderItems = React.useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'profile': {
          return (
            <ProfileCard
              key={item.key}
              checked={item.checked}
              profile={item.profile}
              moderationOpts={moderationOpts!}
              onToggle={onToggleUser}
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
    [moderationOpts, onToggleUser],
  )

  React.useLayoutEffect(() => {
    if (isWeb) {
      setImmediate(() => {
        inputRef?.current?.focus()
      })
    }
  }, [])

  const listHeader = React.useMemo(() => {
    return (
      <View
        style={[
          a.flex_row,
          a.align_center,
          a.relative,
          a.pt_xs,
          a.pb_xs,
          a.pl_lg,
          a.pr_xs,
          a.border_b,
          t.atoms.border_contrast_low,
          t.atoms.bg,
        ]}>
        <View style={[a.flex_1]}>
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

        {isWeb && (
          <Button
            label={_(msg`Close`)}
            size="small"
            shape="round"
            variant={isWeb ? 'ghost' : 'solid'}
            color="secondary"
            style={[a.z_20]}
            onPress={() => control.close()}>
            <ButtonIcon icon={X} size="md" />
          </Button>
        )}
      </View>
    )
  }, [t.atoms.border_contrast_low, t.atoms.bg, _, searchText, control])

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
        a.p_0,
      ]}
      webInnerStyle={[a.p_0, {maxWidth: 500, minWidth: 200}]}
      keyboardDismissMode="on-drag"
    />
  )
}

function ProfileCard({
  checked,
  profile,
  moderationOpts,
  onToggle,
}: {
  checked: boolean
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  onToggle: (did: string, checked: boolean) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const moderation = moderateProfile(profile, moderationOpts)
  const handle = sanitizeHandle(profile.handle, '@')
  const displayName = sanitizeDisplayName(
    profile.displayName || sanitizeHandle(profile.handle),
    moderation.ui('displayName'),
  )

  const handleOnPress = React.useCallback(
    (selected: boolean) => {
      onToggle(profile.did, selected)
    },
    [onToggle, profile.did],
  )

  return (
    <Toggle.Item
      label={_(msg`Add ${displayName} to feed`)}
      name={_(msg`Add ${displayName} to feed`)}
      value={checked}
      onChange={handleOnPress}>
      {({hovered, pressed, focused}) => (
        <View
          style={[
            a.flex_1,
            a.py_md,
            a.px_lg,
            a.gap_md,
            a.align_center,
            a.flex_row,
            pressed || focused
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
              style={[
                t.atoms.text,
                a.leading_tight,
                a.self_start,
                t.atoms.text_contrast_medium,
              ]}
              numberOfLines={1}
              emoji>
              {handle}
            </Text>
          </View>
          <Toggle.Checkbox />
        </View>
      )}
    </Toggle.Item>
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
