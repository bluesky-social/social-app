import {createContext, useContext, useEffect, useRef, useState} from 'react'
import {View} from 'react-native'
import {Sift, SiftItem, type UseSiftReturn} from '@bsky.app/sift'
import {type ModerationOpts} from '@bsky/sdk/moderation'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useProfilesQuery} from '#/state/queries/profile'
import {
  countActiveFilters,
  parseHistoryEntry,
  type SearchFilters,
} from '#/screens/Search/searchParams'
import {useSearchHistory} from '#/screens/Search/util/useSearchHistory'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon} from '#/components/icons/MagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/TimesLarge'
import {Portal} from '#/components/Portal'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import type * as bsky from '#/types/bsky'

const MAX_PROFILES = 5
const MAX_TERMS = 5
/**
 * A full history scrolls inside the dropdown instead of running down the
 * sidebar. Sized so that a full set of profiles leaves the next row cut off,
 * which hints that there is more to scroll to.
 */
const MAX_HEIGHT = 400

/**
 * Whether the arrow keys have been used since the dropdown opened. Rows only
 * show Sift's active state once this is true. A context, because the rows sit
 * inside Sift's FlatList, which doesn't re-render them when this alone changes.
 */
const KeyboardNavContext = createContext(false)
KeyboardNavContext.displayName = 'SearchHistoryKeyboardNavContext'

type HistoryItem =
  | {
      key: string
      type: 'profile'
      position: number
      profile: bsky.profile.AnyProfileView
    }
  | {
      /**
       * Stands in for a profile that is still loading, so rows below it don't
       * jump when the profile arrives.
       */
      key: string
      type: 'profilePlaceholder'
    }
  | {
      key: string
      type: 'term'
      /** The stored history entry, needed to remove it. */
      entry: string
      q: string
      filters: SearchFilters
    }

type SiftItemProps = Parameters<
  Parameters<typeof Sift<HistoryItem>>[0]['render']
>[0]['props']

type RowProps = {
  /** Rendered above the row. Used to put the heading over the first one. */
  header?: React.ReactNode
  active: boolean
  isLast: boolean
  itemProps: SiftItemProps
}

/**
 * Recent searches for a search input, in a Sift dropdown anchored to it. Meant
 * to be mounted only while the input is focused and empty. Renders nothing
 * when there is no history.
 */
export function SearchHistoryDropdown({
  sift,
  onSelectTerm,
  onSelectProfile,
  onPressClearAll,
  onDismiss,
}: {
  sift: UseSiftReturn
  onSelectTerm: (q: string, filters: SearchFilters) => void
  onSelectProfile: (profile: bsky.profile.AnyProfileView) => void
  /**
   * Called when "Clear all" is pressed. The caller owns the confirmation
   * prompt, because this dropdown unmounts as soon as the input loses focus.
   */
  onPressClearAll: () => void
  onDismiss: () => void
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const moderationOpts = useModerationOpts()
  const {
    termHistory,
    accountHistory,
    updateSearchHistory,
    updateProfileHistory,
    deleteSearchHistoryItem,
    deleteProfileHistoryItem,
  } = useSearchHistory()

  /*
   * Query the full list, same as the Search screen, so both share one cache
   * entry. Only the most recent few are shown here.
   */
  const {data: profilesData, isLoading: isLoadingProfiles} = useProfilesQuery({
    handles: accountHistory,
    maintainData: true,
  })

  const items: HistoryItem[] = []
  for (const did of accountHistory.slice(0, MAX_PROFILES)) {
    const profile = profilesData?.profiles.find(p => p.did === did)
    if (profile && moderationOpts) {
      items.push({
        key: did,
        type: 'profile',
        position: items.length,
        profile,
      })
    } else if (isLoadingProfiles || !moderationOpts) {
      items.push({key: did, type: 'profilePlaceholder'})
    }
  }
  for (const entry of termHistory.slice(0, MAX_TERMS)) {
    items.push({
      key: `term-${entry}`,
      type: 'term',
      entry,
      ...parseHistoryEntry(entry),
    })
  }
  const hasItems = items.length > 0

  /*
   * Sift always has an active row, starting on the first, and selects it on
   * Enter or Tab. That suits typed suggestions, but this list opens on focus
   * alone: a pre-selected first row looks like a stuck hover, and Enter or Tab
   * would open a search nobody picked. So nothing is highlighted or selectable
   * from the keyboard until an arrow key is pressed. The ref mirrors the state
   * for the key handler below.
   */
  const [keyboardNav, setKeyboardNav] = useState(false)
  const keyboardNavRef = useRef(false)

  const input: HTMLElement | null = sift.elements.input
  useEffect(() => {
    if (!hasItems || !input || !('addEventListener' in input)) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Let Tab keep moving focus through the page.
        e.stopImmediatePropagation()
      } else if (!keyboardNavRef.current) {
        if (e.key === 'Enter') {
          e.stopImmediatePropagation()
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
          if (e.key === 'ArrowDown') {
            /*
             * Sift is already on the first row, so reveal it instead of
             * letting Sift step past it to the second.
             */
            e.stopImmediatePropagation()
            e.preventDefault()
          }
          keyboardNavRef.current = true
          setKeyboardNav(true)
        }
      }
    }
    // The capture phase runs before Sift's own listener on the same element.
    input.addEventListener('keydown', onKeyDown, {capture: true})
    return () => {
      input.removeEventListener('keydown', onKeyDown, {capture: true})
    }
  }, [input, hasItems])

  if (!hasItems) return null

  const onSelect = (item: HistoryItem) => {
    if (item.type === 'profile') {
      ax.metric('search:recent:press', {
        profileDid: item.profile.did,
        position: item.position,
      })
      updateProfileHistory(item.profile)
      onSelectProfile(item.profile)
    } else if (item.type === 'term') {
      ax.metric('search:query', {
        source: 'history',
        filterCount: countActiveFilters(item.filters),
      })
      updateSearchHistory(item.q, item.filters)
      onSelectTerm(item.q, item.filters)
    }
  }

  /*
   * Removing a row sends Sift back to the first one. Drop the keyboard
   * highlight too, so it doesn't jump there after a mouse click.
   */
  const resetKeyboardNav = () => {
    keyboardNavRef.current = false
    setKeyboardNav(false)
  }

  return (
    <Portal>
      <KeyboardNavContext.Provider value={keyboardNav}>
        <Sift
          sift={sift}
          data={items}
          onSelect={onSelect}
          onDismiss={onDismiss}
          outerStyle={[a.rounded_md, a.w_full, t.atoms.shadow_lg]}
          innerStyle={[
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_low,
            t.atoms.bg,
            a.w_full,
            {maxHeight: MAX_HEIGHT},
          ]}
          render={({item, isFirst, isLast, active, props}) => {
            const row: RowProps = {
              /*
               * Sift has no header slot, so the heading rides above the first
               * row. It sits outside the row's SiftItem and is not selectable.
               */
              header: isFirst ? (
                <Header
                  showClearAll={items.length > 1}
                  onPressClearAll={onPressClearAll}
                />
              ) : undefined,
              active,
              isLast,
              itemProps: props,
            }

            return item.type === 'profile' && moderationOpts ? (
              <ProfileRow
                {...row}
                profile={item.profile}
                moderationOpts={moderationOpts}
                onRemove={() => {
                  resetKeyboardNav()
                  deleteProfileHistoryItem(item.profile)
                }}
              />
            ) : item.type === 'term' ? (
              <TermRow
                {...row}
                q={item.q}
                filterCount={countActiveFilters(item.filters)}
                onRemove={() => {
                  resetKeyboardNav()
                  deleteSearchHistoryItem(item.entry)
                }}
              />
            ) : (
              <Row {...row}>
                <ProfileCard.Header>
                  <ProfileCard.AvatarPlaceholder />
                  <ProfileCard.NameAndHandlePlaceholder />
                </ProfileCard.Header>
              </Row>
            )
          }}
        />
      </KeyboardNavContext.Provider>
    </Portal>
  )
}

function Header({
  showClearAll,
  onPressClearAll,
}: {
  showClearAll: boolean
  onPressClearAll: () => void
}) {
  const {t: l} = useLingui()

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.gap_md,
        a.px_md,
        a.pt_md,
        a.pb_xs,
      ]}>
      <Text style={[a.flex_1, a.text_md, a.font_semi_bold]}>
        <Trans>Recent searches</Trans>
      </Text>
      {showClearAll && (
        <Button
          label={l`Clear all recent searches`}
          onPress={onPressClearAll}
          size="tiny"
          color="secondary"
          style={[a.flex_shrink_0]}
          testID="searchHistoryDropdownClearAllBtn">
          <ButtonText>
            <Trans context="action">Clear all</Trans>
          </ButtonText>
        </Button>
      )}
    </View>
  )
}

/**
 * A selectable row with an optional remove button. The remove button is a
 * sibling of the SiftItem, not a child, so pressing it doesn't also select the
 * row.
 */
function Row({
  header,
  active,
  isLast,
  itemProps,
  removeLabel,
  onRemove,
  children,
}: RowProps & {
  removeLabel?: string
  onRemove?: () => void
  children: React.ReactNode
}) {
  const t = useTheme()
  const keyboardNav = useContext(KeyboardNavContext)
  const highlighted = active && keyboardNav
  const ref = useRef<React.ComponentRef<typeof View>>(null)

  /*
   * The list scrolls once it reaches its max height, and Sift doesn't follow
   * the highlighted row, so bring it into view when the arrow keys land on it.
   */
  useEffect(() => {
    if (!highlighted || !IS_WEB) return
    const node = ref.current as unknown as HTMLElement | null
    node?.scrollIntoView?.({block: 'nearest'})
  }, [highlighted])

  return (
    <View ref={ref}>
      {header}
      <View style={[a.flex_row, a.align_center]}>
        <SiftItem
          {...itemProps}
          aria-selected={highlighted}
          style={s => [
            a.flex_1,
            a.py_sm,
            a.pl_md,
            a.pr_5xl,
            highlighted || s.hovered || s.pressed
              ? [t.atoms.bg_contrast_25]
              : [],
            isLast && {
              paddingBottom: a.py_sm.paddingTop * 1.2,
            },
          ]}>
          {children}
        </SiftItem>
        {onRemove && removeLabel && (
          <Button
            label={removeLabel}
            onPress={onRemove}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            style={[a.absolute, {right: 4}, a.bg_transparent]}>
            <ButtonIcon icon={XIcon} />
          </Button>
        )}
      </View>
    </View>
  )
}

function ProfileRow({
  profile,
  moderationOpts,
  onRemove,
  ...row
}: RowProps & {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  onRemove: () => void
}) {
  const {t: l} = useLingui()

  return (
    <Row {...row} removeLabel={l`Remove profile`} onRemove={onRemove}>
      <ProfileCard.Header>
        <ProfileCard.Avatar
          disabledPreview
          profile={profile}
          moderationOpts={moderationOpts}
        />
        <ProfileCard.NameAndHandle
          profile={profile}
          moderationOpts={moderationOpts}
        />
      </ProfileCard.Header>
    </Row>
  )
}

function TermRow({
  q,
  filterCount,
  onRemove,
  ...row
}: RowProps & {
  q: string
  filterCount: number
  onRemove: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Row {...row} removeLabel={l`Remove ${q}`} onRemove={onRemove}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <View style={[a.align_center, {width: 40}]}>
          <MagnifyingGlassIcon
            fill={t.atoms.text_contrast_low.color}
            size="xl"
          />
        </View>
        <Text
          emoji
          style={[a.flex_shrink, a.text_md, a.leading_snug]}
          numberOfLines={1}>
          {q}
        </Text>
        {filterCount > 0 && (
          <View
            style={[
              a.flex_shrink_0,
              a.rounded_sm,
              a.px_sm,
              a.py_2xs,
              t.atoms.bg_contrast_50,
            ]}>
            <Text
              style={[a.text_xs, a.font_medium, t.atoms.text_contrast_medium]}>
              <Plural value={filterCount} one="+# filter" other="+# filters" />
            </Text>
          </View>
        )}
      </View>
    </Row>
  )
}
