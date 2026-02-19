import {useDeferredValue, useRef, useState} from 'react'
import {type Role, type TextInput, View} from 'react-native'
import {
  useDismiss,
  useFloating,
  useId,
  useInteractions,
  useListNavigation,
  useRole,
} from '@floating-ui/react'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {StackActions, useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {type NavigationProp} from '#/lib/routes/types'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {useActorAutocompleteQuery} from '#/state/queries/actor-autocomplete'
import {unstableCacheProfileView} from '#/state/queries/unstable-profile-cache'
import {atoms as a, flatten, useTheme} from '#/alf'
import {SearchInput} from '#/components/forms/SearchInput'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'

export function DesktopSearch() {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const qc = useQueryClient()

  const searchInputRef = useRef<TextInput>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const listRef = useRef<Array<HTMLElement | null>>([])

  const {data: autocompleteData, isFetching} = useActorAutocompleteQuery(
    deferredQuery,
    true,
  )

  const moderationOpts = useModerationOpts()
  const profiles = autocompleteData ?? []
  const hasSearchLink = deferredQuery.length > 0

  // Floating UI setup — used for interaction hooks (ARIA combobox pattern),
  // not for positioning (we keep the existing CSS absolute layout).
  const {refs, context} = useFloating({
    open,
    onOpenChange(nextOpen, _event, reason) {
      setOpen(nextOpen)
      if (!nextOpen && reason === 'escape-key') {
        setQuery('')
        searchInputRef.current?.blur()
      }
    },
  })

  const role = useRole(context, {role: 'listbox'})
  const dismiss = useDismiss(context)
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  })

  const {getReferenceProps, getFloatingProps, getItemProps} = useInteractions([
    role,
    dismiss,
    listNav,
  ])

  const listboxId = useId()

  const navigateToSearch = () => {
    if (!deferredQuery.length) return
    navigation.dispatch(StackActions.push('Search', {q: deferredQuery}))
    setQuery('')
    setOpen(false)
    searchInputRef.current?.blur()
  }

  const navigateToProfile = (profileIndex: number) => {
    const profile = profiles[profileIndex]
    if (!profile) return
    unstableCacheProfileView(qc, profile)
    navigation.dispatch(StackActions.push('Profile', {name: profile.did}))
    setQuery('')
    setOpen(false)
    searchInputRef.current?.blur()
  }

  const selectItem = (index: number) => {
    if (hasSearchLink && index === 0) {
      navigateToSearch()
    } else {
      navigateToProfile(hasSearchLink ? index - 1 : index)
    }
  }

  const onChangeText = (text: string) => {
    setQuery(text)
    if (!open) setOpen(true)
    setActiveIndex(text.length > 0 ? 0 : null)
  }

  const onPressCancelSearch = () => {
    setQuery('')
    setOpen(false)
  }

  // getReferenceProps produces the merged keyboard + ARIA props.
  // We must use onKeyDownCapture because RNW's TextInput internally calls
  // stopPropagation() on all keydown events, preventing normal bubbling.
  // Capture phase (parent→child) fires before the target's handler.
  const referenceProps = getReferenceProps({
    onKeyDown(e: React.KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex != null) {
          selectItem(activeIndex)
        } else {
          navigateToSearch()
        }
      }
    },
  })
  const {onKeyDown: refOnKeyDown, ...refAriaProps} = referenceProps

  // Extract role/id from floating props for the listbox View
  const floatingProps = getFloatingProps()

  return (
    <View style={[a.w_full, a.z_10]}>
      {/* Wrapper div receives floating-ui reference + ARIA props.
          onKeyDownCapture is needed because RNW's TextInput stops keydown
          propagation — capture phase fires before that happens. */}
      <div
        ref={refs.setReference}
        onKeyDownCapture={
          refOnKeyDown as React.KeyboardEventHandler<HTMLDivElement>
        }
        {...(refAriaProps as React.HTMLAttributes<HTMLDivElement>)}
        style={{width: '100%'}}>
        <SearchInput
          ref={searchInputRef}
          value={query}
          onChangeText={onChangeText}
          onClearText={onPressCancelSearch}
          onFocus={() => setOpen(true)}
          onBlur={(e: any) => {
            const relatedTarget = (e as React.FocusEvent)
              .relatedTarget as Node | null
            if (
              relatedTarget &&
              refs.floating.current?.contains(relatedTarget)
            ) {
              return
            }
            setOpen(false)
          }}
        />
      </div>
      {open && moderationOpts && (
        <View style={[a.w_full]}>
          <View
            ref={refs.setFloating}
            role={floatingProps.role as Role}
            id={floatingProps.id as string}
            style={[
              t.atoms.bg,
              t.atoms.border_contrast_low,
              a.w_full,
              a.border,
              a.mt_sm,
              a.rounded_sm,
              a.overflow_hidden,
              a.absolute,
              a.shadow_lg,
              a.zoom_fade_in,
            ]}>
            {deferredQuery.length === 0 ? (
              <View style={[a.py_xl, a.gap_sm, a.align_center]}>
                <SearchIcon size="2xl" style={[t.atoms.text_contrast_low]} />
                <Text
                  style={[a.text_sm, t.atoms.text_contrast_low, a.text_center]}>
                  <Trans>Start typing to search</Trans>
                </Text>
              </View>
            ) : (
              <>
                {/* Search link option */}
                <div
                  ref={node => {
                    listRef.current[0] = node
                  }}
                  id={`${listboxId}-option-0`}
                  role="option"
                  aria-selected={activeIndex === 0}
                  style={flatten([
                    a.w_full,
                    a.py_lg,
                    a.px_md,
                    a.pointer,
                    (profiles.length > 0 || isFetching) && a.border_b,
                    t.atoms.border_contrast_low,
                    activeIndex === 0 && t.atoms.bg_contrast_25,
                  ])}
                  {...getItemProps({
                    onClick() {
                      navigateToSearch()
                    },
                  })}>
                  <Text style={[a.text_sm, a.leading_snug]}>
                    {_(msg`Search for "${deferredQuery}"`)}
                  </Text>
                </div>

                {/* Loading state */}
                {isFetching && !profiles.length ? (
                  <View style={[a.p_xl, a.align_center]}>
                    <Loader size="md" />
                  </View>
                ) : (
                  profiles.map((profile, i) => {
                    const itemIndex = 1 + i
                    return (
                      <div
                        key={profile.did}
                        ref={node => {
                          listRef.current[itemIndex] = node
                        }}
                        id={`${listboxId}-option-${itemIndex}`}
                        role="option"
                        aria-selected={activeIndex === itemIndex}
                        aria-label={_(msg`View ${profile.handle}'s profile`)}
                        style={flatten([
                          a.flex,
                          a.flex_col,
                          {paddingLeft: 6, paddingRight: 6},
                          a.px_sm,
                          a.pointer,
                          activeIndex === itemIndex && t.atoms.bg_contrast_25,
                        ])}
                        {...getItemProps({
                          onClick() {
                            navigateToProfile(i)
                          },
                        })}>
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
                          </ProfileCard.Header>
                        </ProfileCard.Outer>
                      </div>
                    )
                  })
                )}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
