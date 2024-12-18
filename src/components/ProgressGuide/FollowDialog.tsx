import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ScrollView, TextInput, useWindowDimensions, View} from 'react-native'
import Animated, {
  LayoutAnimationConfig,
  LinearTransition,
  ZoomInEasyDown,
} from 'react-native-reanimated'
import {AppBskyActorDefs, ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useNonReactiveCallback} from '#/lib/hooks/useNonReactiveCallback'
import {cleanError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {isWeb} from '#/platform/detection'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorSearchPaginated} from '#/state/queries/actor-search'
import {usePreferencesQuery} from '#/state/queries/preferences'
import {useSuggestedFollowsByActorQuery} from '#/state/queries/suggested-follows'
import {useSession} from '#/state/session'
import {Follow10ProgressGuide} from '#/state/shell/progress-guide'
import {ListMethods} from '#/view/com/util/List'
import {
  popularInterests,
  useInterestsDisplayNames,
} from '#/screens/Onboarding/state'
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
import {ProgressGuideTask} from './Task'

type Item =
  | {
      type: 'profile'
      key: string
      profile: AppBskyActorDefs.ProfileView
      isSuggestion: boolean
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

export function FollowDialog({guide}: {guide: Follow10ProgressGuide}) {
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
        <DialogInner guide={guide} />
      </Dialog.Outer>
    </>
  )
}

// Fine to keep this top-level.
let lastSelectedInterest = ''
let lastSearchText = ''

function DialogInner({guide}: {guide: Follow10ProgressGuide}) {
  const {_} = useLingui()
  const interestsDisplayNames = useInterestsDisplayNames()
  const {data: preferences} = usePreferencesQuery()
  const personalizedInterests = preferences?.interests?.tags
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(personalizedInterests))
  const [selectedInterest, setSelectedInterest] = useState(
    () =>
      lastSelectedInterest ||
      (personalizedInterests && interests.includes(personalizedInterests[0])
        ? personalizedInterests[0]
        : interests[0]),
  )
  const [searchText, setSearchText] = useState(lastSearchText)
  const moderationOpts = useModerationOpts()
  const listRef = useRef<ListMethods>(null)
  const inputRef = useRef<TextInput>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const {currentAccount} = useSession()
  const [suggestedAccounts, setSuggestedAccounts] = useState<
    Map<string, AppBskyActorDefs.ProfileView[]>
  >(() => new Map())

  useEffect(() => {
    lastSearchText = searchText
    lastSelectedInterest = selectedInterest
  }, [searchText, selectedInterest])

  const query = searchText || selectedInterest
  const {
    data: searchResults,
    isFetching,
    error,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useActorSearchPaginated({
    query,
  })

  const hasSearchText = !!searchText

  const items = useMemo(() => {
    const results = searchResults?.pages.flatMap(r => r.actors)
    let _items: Item[] = []
    const seen = new Set<string>()

    if (isError) {
      _items.push({
        type: 'empty',
        key: 'empty',
        message: _(msg`We're having network issues, try again`),
      })
    } else if (results) {
      // First pass: search results
      for (const profile of results) {
        if (profile.did === currentAccount?.did) continue
        if (profile.viewer?.following) continue
        // my sincere apologies to Jake Gold - your bio is too keyword-filled and
        // your page-rank too high, so you're at the top of half the categories -sfn
        if (
          !hasSearchText &&
          profile.did === 'did:plc:tpg43qhh4lw4ksiffs4nbda3' &&
          // constrain to 'tech'
          selectedInterest !== 'tech'
        ) {
          continue
        }
        seen.add(profile.did)
        _items.push({
          type: 'profile',
          // Don't share identity across tabs or typing attempts
          key: query + ':' + profile.did,
          profile,
          isSuggestion: false,
        })
      }
      // Second pass: suggestions
      _items = _items.flatMap(item => {
        if (item.type !== 'profile') {
          return item
        }
        const suggestions = suggestedAccounts.get(item.profile.did)
        if (!suggestions) {
          return item
        }
        const itemWithSuggestions = [item]
        for (const suggested of suggestions) {
          if (seen.has(suggested.did)) {
            // Skip search results from previous step or already seen suggestions
            continue
          }
          seen.add(suggested.did)
          itemWithSuggestions.push({
            type: 'profile',
            key: suggested.did,
            profile: suggested,
            isSuggestion: true,
          })
          if (itemWithSuggestions.length === 1 + 3) {
            break
          }
        }
        return itemWithSuggestions
      })
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
  }, [
    _,
    searchResults,
    isError,
    currentAccount?.did,
    hasSearchText,
    selectedInterest,
    suggestedAccounts,
    query,
  ])

  if (searchText && !isFetching && !items.length && !isError) {
    items.push({type: 'empty', key: 'empty', message: _(msg`No results`)})
  }

  const renderItems = useCallback(
    ({item, index}: {item: Item; index: number}) => {
      switch (item.type) {
        case 'profile': {
          return (
            <FollowProfileCard
              profile={item.profile}
              isSuggestion={item.isSuggestion}
              moderationOpts={moderationOpts!}
              setSuggestedAccounts={setSuggestedAccounts}
              noBorder={index === 0}
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

  const onSelectTab = useCallback(
    (interest: string) => {
      setSelectedInterest(interest)
      inputRef.current?.clear()
      setSearchText('')
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: false,
      })
    },
    [setSelectedInterest, setSearchText],
  )

  const listHeader = (
    <Header
      guide={guide}
      inputRef={inputRef}
      listRef={listRef}
      searchText={searchText}
      onSelectTab={onSelectTab}
      setHeaderHeight={setHeaderHeight}
      setSearchText={setSearchText}
      interests={interests}
      selectedInterest={selectedInterest}
      interestsDisplayNames={interestsDisplayNames}
    />
  )

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
        a.px_0,
        web([a.py_0, {height: '100vh', maxHeight: 600}]),
        native({height: '100%'}),
      ]}
      webInnerContentContainerStyle={a.py_0}
      webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
      keyboardDismissMode="on-drag"
      scrollIndicatorInsets={{top: headerHeight}}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      onEndReached={onEndReached}
      itemLayoutAnimation={LinearTransition}
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

let Header = ({
  guide,
  inputRef,
  listRef,
  searchText,
  onSelectTab,
  setHeaderHeight,
  setSearchText,
  interests,
  selectedInterest,
  interestsDisplayNames,
}: {
  guide: Follow10ProgressGuide
  inputRef: React.RefObject<TextInput>
  listRef: React.RefObject<ListMethods>
  onSelectTab: (v: string) => void
  searchText: string
  setHeaderHeight: (v: number) => void
  setSearchText: (v: string) => void
  interests: string[]
  selectedInterest: string
  interestsDisplayNames: Record<string, string>
}): React.ReactNode => {
  const t = useTheme()
  const control = Dialog.useDialogContext()
  return (
    <View
      onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}
      style={[
        a.relative,
        web(a.pt_lg),
        native(a.pt_4xl),
        a.pb_xs,
        a.border_b,
        t.atoms.border_contrast_low,
        t.atoms.bg,
      ]}>
      <HeaderTop guide={guide} />

      <View style={[web(a.pt_xs), a.pb_xs]}>
        <SearchInput
          inputRef={inputRef}
          defaultValue={searchText}
          onChangeText={text => {
            setSearchText(text)
            listRef.current?.scrollToOffset({offset: 0, animated: false})
          }}
          onEscape={control.close}
        />
        <Tabs
          onSelectTab={onSelectTab}
          interests={interests}
          selectedInterest={selectedInterest}
          hasSearchText={!!searchText}
          interestsDisplayNames={interestsDisplayNames}
        />
      </View>
    </View>
  )
}
Header = memo(Header)

function HeaderTop({guide}: {guide: Follow10ProgressGuide}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  return (
    <View
      style={[
        a.px_lg,
        a.relative,
        a.flex_row,
        a.justify_between,
        a.align_center,
      ]}>
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
      <View style={isWeb && {paddingRight: 36}}>
        <ProgressGuideTask
          current={guide.numFollows + 1}
          total={10 + 1}
          title={`${guide.numFollows} / 10`}
          tabularNumsTitle
        />
      </View>
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
  )
}

let Tabs = ({
  onSelectTab,
  interests,
  selectedInterest,
  hasSearchText,
  interestsDisplayNames,
}: {
  onSelectTab: (tab: string) => void
  interests: string[]
  selectedInterest: string
  hasSearchText: boolean
  interestsDisplayNames: Record<string, string>
}): React.ReactNode => {
  const listRef = useRef<ScrollView>(null)
  const [scrollX, setScrollX] = useState(0)
  const [totalWidth, setTotalWidth] = useState(0)
  const pendingTabOffsets = useRef<{x: number; width: number}[]>([])
  const [tabOffsets, setTabOffsets] = useState<{x: number; width: number}[]>([])

  const onInitialLayout = useNonReactiveCallback(() => {
    const index = interests.indexOf(selectedInterest)
    scrollIntoViewIfNeeded(index)
  })

  useEffect(() => {
    if (tabOffsets) {
      onInitialLayout()
    }
  }, [tabOffsets, onInitialLayout])

  function scrollIntoViewIfNeeded(index: number) {
    const btnLayout = tabOffsets[index]
    if (!btnLayout) return

    const viewportLeftEdge = scrollX
    const viewportRightEdge = scrollX + totalWidth
    const shouldScrollToLeftEdge = viewportLeftEdge > btnLayout.x
    const shouldScrollToRightEdge =
      viewportRightEdge < btnLayout.x + btnLayout.width

    if (shouldScrollToLeftEdge) {
      listRef.current?.scrollTo({
        x: btnLayout.x - tokens.space.lg,
        animated: true,
      })
    } else if (shouldScrollToRightEdge) {
      listRef.current?.scrollTo({
        x: btnLayout.x - totalWidth + btnLayout.width + tokens.space.lg,
        animated: true,
      })
    }
  }

  function handleSelectTab(index: number) {
    const tab = interests[index]
    onSelectTab(tab)
    scrollIntoViewIfNeeded(index)
  }

  function handleTabLayout(index: number, x: number, width: number) {
    if (!tabOffsets.length) {
      pendingTabOffsets.current[index] = {x, width}
      if (pendingTabOffsets.current.length === interests.length) {
        setTabOffsets(pendingTabOffsets.current)
      }
    }
  }

  return (
    <ScrollView
      ref={listRef}
      horizontal
      contentContainerStyle={[a.gap_sm, a.px_lg]}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToOffsets={
        tabOffsets.length === interests.length
          ? tabOffsets.map(o => o.x - tokens.space.xl)
          : undefined
      }
      onLayout={evt => setTotalWidth(evt.nativeEvent.layout.width)}
      scrollEventThrottle={200} // big throttle
      onScroll={evt => setScrollX(evt.nativeEvent.contentOffset.x)}>
      {interests.map((interest, i) => {
        const active = interest === selectedInterest && !hasSearchText
        return (
          <Tab
            key={interest}
            onSelectTab={handleSelectTab}
            active={active}
            index={i}
            interest={interest}
            interestsDisplayName={interestsDisplayNames[interest]}
            onLayout={handleTabLayout}
          />
        )
      })}
    </ScrollView>
  )
}
Tabs = memo(Tabs)

let Tab = ({
  onSelectTab,
  interest,
  active,
  index,
  interestsDisplayName,
  onLayout,
}: {
  onSelectTab: (index: number) => void
  interest: string
  active: boolean
  index: number
  interestsDisplayName: string
  onLayout: (index: number, x: number, width: number) => void
}): React.ReactNode => {
  const {_} = useLingui()
  const activeText = active ? _(msg` (active)`) : ''
  return (
    <View
      key={interest}
      onLayout={e =>
        onLayout(index, e.nativeEvent.layout.x, e.nativeEvent.layout.width)
      }>
      <Button
        label={_(msg`Search for "${interestsDisplayName}"${activeText}`)}
        variant={active ? 'solid' : 'outline'}
        color={active ? 'primary' : 'secondary'}
        size="small"
        onPress={() => onSelectTab(index)}>
        <ButtonIcon icon={SearchIcon} />
        <ButtonText>{interestsDisplayName}</ButtonText>
      </Button>
    </View>
  )
}
Tab = memo(Tab)

let FollowProfileCard = ({
  profile,
  moderationOpts,
  isSuggestion,
  setSuggestedAccounts,
  noBorder,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  isSuggestion: boolean
  setSuggestedAccounts: (
    updater: (
      v: Map<string, AppBskyActorDefs.ProfileView[]>,
    ) => Map<string, AppBskyActorDefs.ProfileView[]>,
  ) => void
  noBorder?: boolean
}): React.ReactNode => {
  const [hasFollowed, setHasFollowed] = useState(false)
  const followupSuggestion = useSuggestedFollowsByActorQuery({
    did: profile.did,
    enabled: hasFollowed,
  })
  const candidates = followupSuggestion.data?.suggestions

  useEffect(() => {
    // TODO: Move out of effect.
    if (hasFollowed && candidates && candidates.length > 0) {
      setSuggestedAccounts(suggestions => {
        const newSuggestions = new Map(suggestions)
        newSuggestions.set(profile.did, candidates)
        return newSuggestions
      })
    }
  }, [hasFollowed, profile.did, candidates, setSuggestedAccounts])

  return (
    <LayoutAnimationConfig skipEntering={!isSuggestion}>
      <Animated.View entering={native(ZoomInEasyDown)}>
        <FollowProfileCardInner
          profile={profile}
          moderationOpts={moderationOpts}
          onFollow={() => setHasFollowed(true)}
          noBorder={noBorder}
        />
      </Animated.View>
    </LayoutAnimationConfig>
  )
}
FollowProfileCard = memo(FollowProfileCard)

function FollowProfileCardInner({
  profile,
  moderationOpts,
  onFollow,
  noBorder,
}: {
  profile: AppBskyActorDefs.ProfileView
  moderationOpts: ModerationOpts
  onFollow?: () => void
  noBorder?: boolean
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
            noBorder && a.border_t_0,
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
                logContext="PostOnboardingFindFollows"
                shape="round"
                onPress={onFollow}
                colorInverted
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
        a.py_md,
        a.px_lg,
        a.border_t,
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
  defaultValue,
}: {
  onChangeText: (text: string) => void
  onEscape: () => void
  inputRef: React.RefObject<TextInput>
  defaultValue: string
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
      style={[a.flex_row, a.align_center, a.gap_sm, a.px_lg, a.py_xs]}>
      <SearchIcon
        size="md"
        fill={interacted ? t.palette.primary_500 : t.palette.contrast_300}
      />

      <TextInput
        ref={inputRef}
        placeholder={_(msg`Search by name or interest`)}
        defaultValue={defaultValue}
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

function boostInterests(boosts?: string[]) {
  return (_a: string, _b: string) => {
    const indexA = boosts?.indexOf(_a) ?? -1
    const indexB = boosts?.indexOf(_b) ?? -1
    const rankA = indexA === -1 ? Infinity : indexA
    const rankB = indexB === -1 ? Infinity : indexB
    return rankA - rankB
  }
}
