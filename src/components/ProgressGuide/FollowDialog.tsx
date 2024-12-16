import {useCallback, useMemo, useRef, useState} from 'react'
import {ScrollView, TextInput, useWindowDimensions, View} from 'react-native'
import {AppBskyActorDefs, ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorSearchPaginated} from '#/state/queries/actor-search'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {ListMethods} from '#/view/com/util/List'
import {useInterestsDisplayNames} from '#/screens/Onboarding/state'
import {
  atoms as a,
  native,
  tokens,
  useBreakpoints,
  useTheme,
  ViewStyleProp,
  web,
} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {useInteractionState} from '#/components/hooks/useInteractionState'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass2'
import {PersonGroup_Stroke2_Corner2_Rounded as PersonGroupIcon} from '#/components/icons/Person'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {ListFooter} from '../Lists'

type Item =
  | {
      type: 'profile'
      key: string
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

export function FollowDialog() {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const {gtMobile} = useBreakpoints()
  const {height: minHeight} = useWindowDimensions()

  return (
    <>
      <Button
        label={_(msg`Find people to follow`)}
        onPress={control.open}
        size={gtMobile ? 'small' : 'large'}
        color="primary"
        variant="solid">
        <ButtonIcon icon={PersonGroupIcon} />
        <ButtonText>
          <Trans>Find people to follow</Trans>
        </ButtonText>
      </Button>
      <Dialog.Outer control={control} nativeOptions={{minHeight}}>
        <Dialog.Handle />
        <DialogInner />
      </Dialog.Outer>
    </>
  )
}

function DialogInner() {
  const {_} = useLingui()
  const t = useTheme()
  const interestsDisplayNames = useInterestsDisplayNames()
  const {data: preferences} = usePreferencesQuery()
  const moderationOpts = useModerationOpts()
  const listRef = useRef<ListMethods>(null)
  const inputRef = useRef<TextInput>(null)
  const control = Dialog.useDialogContext()
  const [tabOffsets, setTabOffsets] = useState<number[]>([])
  const {currentAccount} = useSession()
  const [searchText, setSearchText] = useState('')

  const personalizedInterests = preferences?.interests?.tags
  const interests = Object.keys(interestsDisplayNames).sort((a, b) => {
    const indexA = personalizedInterests?.indexOf(a) ?? -1
    const indexB = personalizedInterests?.indexOf(b) ?? -1
    const rankA = indexA === -1 ? Infinity : indexA
    const rankB = indexB === -1 ? Infinity : indexB
    return rankA - rankB
  })
  const [selectedInterest, setSelectedInterest] = useState(
    personalizedInterests && interests.includes(personalizedInterests[0])
      ? personalizedInterests[0]
      : interests[0],
  )

  const {
    data: searchResults,
    isFetching,
    error,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useActorSearchPaginated({
    query: searchText || selectedInterest,
  })

  const hasSearchText = !!searchText

  const items = useMemo(() => {
    const results = searchResults?.pages.flatMap(r => r.actors)
    let _items: Item[] = []

    if (isError) {
      _items.push({
        type: 'empty',
        key: 'empty',
        message: _(msg`We're having network issues, try again`),
      })
    } else if (results?.length) {
      for (const profile of results) {
        if (profile.did === currentAccount?.did) continue
        if (profile.viewer?.following) continue
        // my sincere apologies to Jake Gold - your bio is too keyword-filled and
        // your page-rank too high, so you're at the top of half the categories -sfn
        if (
          !hasSearchText &&
          profile.did === 'did:plc:tpg43qhh4lw4ksiffs4nbda3'
        )
          continue
        _items.push({
          type: 'profile',
          key: profile.did,
          profile,
        })
      }
    } else {
      const placeholders: Item[] = Array(10)
        .fill(0)
        .map((__, i) => ({
          type: 'placeholder',
          key: i + '',
        }))

      _items.push(...placeholders)
    }

    return _items
  }, [_, searchResults, isError, currentAccount?.did, hasSearchText])

  if (searchText && !isFetching && !items.length && !isError) {
    items.push({type: 'empty', key: 'empty', message: _(msg`No results`)})
  }

  const renderItems = useCallback(
    ({item}: {item: Item}) => {
      switch (item.type) {
        case 'profile': {
          return (
            <ReplacableProfileCard
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
            <Trans>Find people to follow</Trans>
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

        <View style={[web(a.pt_xs), a.pb_xs]}>
          <SearchInput
            inputRef={inputRef}
            onChangeText={text => {
              setSearchText(text)
              listRef.current?.scrollToOffset({offset: 0, animated: false})
            }}
            onEscape={control.close}
          />
          <ScrollView
            horizontal
            contentContainerStyle={[a.gap_sm, a.px_xl]}
            style={{marginHorizontal: -tokens.space.xl}}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToOffsets={
              tabOffsets.length === interests.length ? tabOffsets : undefined
            }>
            {interests.map((interest, i) => {
              const active = interest === selectedInterest && !searchText
              const activeText = active ? _(msg` (active)`) : ''
              return (
                <View
                  key={interest}
                  onLayout={evt => {
                    const x = evt.nativeEvent.layout.x
                    setTabOffsets(offsets => {
                      const [...next] = offsets
                      next[i] = x - tokens.space.xl
                      return next
                    })
                  }}>
                  <Button
                    key={interest}
                    label={_(
                      msg`Search for "${interestsDisplayNames[interest]}"${activeText}`,
                    )}
                    variant={active ? 'solid' : 'outline'}
                    color={active ? 'primary' : 'secondary'}
                    size="small"
                    onPress={() => {
                      setSelectedInterest(interest)
                      inputRef.current?.clear()
                      setSearchText('')
                      listRef.current?.scrollToOffset({
                        offset: 0,
                        animated: false,
                      })
                    }}>
                    <ButtonIcon icon={SearchIcon} />
                    <ButtonText>{interestsDisplayNames[interest]}</ButtonText>
                  </Button>
                </View>
              )
            })}
          </ScrollView>
        </View>
      </View>
    )
  }, [
    t.atoms.border_contrast_low,
    t.atoms.bg,
    t.atoms.text_contrast_high,
    _,
    control,
    searchText,
    selectedInterest,
    interests,
    interestsDisplayNames,
    setSelectedInterest,
    tabOffsets,
  ])

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more people to follow', {message: err})
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

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
      onEndReached={onEndReached}
      ListFooterComponent={
        <ListFooter
          isFetchingNextPage={isFetchingNextPage}
          error={cleanError(error)}
          onRetry={fetchNextPage}
        />
      }
    />
  )
}

function ReplacableProfileCard({
  profile,
  moderationOpts,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
}) {
  return (
    <View style={[a.pt_md, a.px_lg]}>
      <ReplacableProfileCardInner
        profile={profile}
        moderationOpts={moderationOpts}
      />
    </View>
  )

  // Replaces the profile card with a similar one after pressing follow. Pending backend fix -sfn
  //
  // const [hasFollowed, setHasFollowed] = useState(false)
  // const followupSuggestion = useSuggestedFollowsByActorQuery({
  //   did: profile.did,
  //   enabled: hasFollowed,
  // })
  // const followupProfile = followupSuggestion.data?.suggestions?.[0]

  // if (!followupSuggestion.isPending) {
  //   if (followupProfile) {
  //     console.log('! followup found for', profile.handle)
  //   } else {
  //     console.log('  no suggestions for', profile.handle)
  //   }
  // }

  // return (
  //   <LayoutAnimationConfig skipEntering skipExiting>
  //     {hasFollowed && followupProfile ? (
  //       <Animated.View entering={native(ZoomIn)} key="in">
  //         <ReplacableProfileCard
  //           profile={followupProfile}
  //           moderationOpts={moderationOpts}
  //         />
  //       </Animated.View>
  //     ) : (
  //       <Animated.View
  //         exiting={native(ZoomOut)}
  //         key="out"
  //         style={[a.pt_md, a.px_lg]}>
  //         <ReplacableProfileCardInner
  //           profile={profile}
  //           moderationOpts={moderationOpts}
  //           onFollow={() => setHasFollowed(true)}
  //         />
  //       </Animated.View>
  //     )}
  //   </LayoutAnimationConfig>
  // )
}

function ReplacableProfileCardInner({
  profile,
  moderationOpts,
  onFollow,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  onFollow?: () => void
}) {
  const control = Dialog.useDialogContext()
  const t = useTheme()
  return (
    <ProfileCard.Link
      profile={profile}
      style={[a.flex_1]}
      onPress={() => control.close()}>
      {({hovered, pressed}) => (
        <CardOuter
          style={[
            a.flex_1,
            (hovered || pressed) && t.atoms.border_contrast_high,
          ]}>
          <ProfileCard.Outer>
            <ProfileCard.Header>
              <ProfileCard.Avatar
                profile={profile}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.NameAndHandle
                profile={profile}
                moderationOpts={moderationOpts}
              />
              <ProfileCard.FollowButton
                profile={profile}
                moderationOpts={moderationOpts}
                logContext="FeedInterstitial"
                color="secondary_inverted"
                shape="round"
                onPress={onFollow}
              />
            </ProfileCard.Header>
            <ProfileCard.Description profile={profile} numberOfLines={2} />
          </ProfileCard.Outer>
        </CardOuter>
      )}
    </ProfileCard.Link>
  )
}

function CardOuter({
  children,
  style,
}: {children: React.ReactNode | React.ReactNode[]} & ViewStyleProp) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.bg,
        t.atoms.border_contrast_low,
        style,
      ]}>
      {children}
    </View>
  )
}

function SearchInput({
  onChangeText,
  onEscape,
  inputRef,
}: {
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
      <SearchIcon
        size="md"
        fill={interacted ? t.palette.primary_500 : t.palette.contrast_300}
      />

      <TextInput
        ref={inputRef}
        placeholder={_(msg`Search`)}
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
        accessibilityLabel={_(msg`Search profiles`)}
        accessibilityHint={_(msg`Search profiles`)}
      />
    </View>
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
