import {useMemo, useRef, useState} from 'react'
import {type ScrollView, View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {
  countActiveFilters,
  FILTER_PARAM_KEYS,
  hasActiveFilters,
  type SearchFilters,
} from '#/screens/Search/searchParams'
import {atoms as a, native, useBreakpoints, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {SettingsSliderVertical_Stroke2_Corner0_Rounded as SettingsSliderIcon} from '#/components/icons/SettingsSlider'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import {SearchLanguageDropdown} from '../SearchLanguageDropdown'
import {ClearableDateField, DEFAULT_DATE} from './ClearableDateField'
import {ClearableInput} from './ClearableInput'
import {FilterBlock} from './FilterBlock'
import {FollowingDropdown} from './FollowingDropdown'
import {MediaDropdown} from './MediaDropdown'
import {RepliesDropdown} from './RepliesDropdown'
import {
  type AdvancedFilter,
  type FollowingFilter,
  makeFilter,
  type MediaFilter,
  parseAdvancedSearch,
  type RepliesFilter,
  serializeAdvancedSearch,
} from './utils'

const MAX_FILTERS = 20

export function AdvancedSearchDialog({
  q,
  filters,
  onSubmit,
}: {
  q: string
  filters: SearchFilters
  onSubmit: (q: string, filters: SearchFilters) => void
}) {
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()
  const filtersActive = hasActiveFilters(filters)
  const stateKey = useMemo(
    () =>
      JSON.stringify([q, ...FILTER_PARAM_KEYS.map(key => filters[key] ?? '')]),
    [q, filters],
  )

  return (
    <>
      <View style={[a.relative]}>
        <Button
          label={l`Open advanced search options`}
          size="small"
          color="secondary"
          style={native([a.py_sm, a.px_sm])}
          onPress={() => {
            ax.metric('search:advanced:press', {
              filterCount: countActiveFilters(filters),
            })
            control.open()
          }}>
          <ButtonIcon icon={SettingsSliderIcon} />
          <ButtonText>
            <Trans>Advanced search</Trans>
          </ButtonText>
        </Button>
        {filtersActive && (
          <View
            accessible={false}
            style={[
              a.absolute,
              a.rounded_full,
              {
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                backgroundColor: t.palette.primary_500,
              },
            ]}
          />
        )}
      </View>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <DialogInner
          key={stateKey}
          control={control}
          q={q}
          filters={filters}
          onSubmit={onSubmit}
        />
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  control,
  q,
  filters: filterParams,
  onSubmit,
}: {
  control: Dialog.DialogControlProps
  q: string
  filters: SearchFilters
  onSubmit: (q: string, filters: SearchFilters) => void
}) {
  const ax = useAnalytics()
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtTablet} = useBreakpoints()
  // Two-column layout for the word fields, web-only at the widest breakpoint.
  const twoColumn = IS_WEB && gtTablet

  const parsed = useMemo(
    () => parseAdvancedSearch(q, filterParams),
    [q, filterParams],
  )

  const [query, setQuery] = useState(parsed.query)
  const [exactPhrase, setExactPhrase] = useState(parsed.exactPhrase)
  const [negatedWords, setNegatedWords] = useState(parsed.negatedWords)
  const [language, setLanguage] = useState(parsed.language)

  const [media, setMedia] = useState<MediaFilter>(parsed.media)
  const [replies, setReplies] = useState<RepliesFilter>(parsed.replies)
  const [following, setFollowing] = useState<FollowingFilter>(parsed.following)

  /*
   * The date picker requires a valid date, so these always hold one. The
   * accompanying `active` flags track whether the date is actually part of the
   * query, so that a date equal to today (the default) can still be applied.
   */
  const [dateSince, setDateSince] = useState(parsed.since || DEFAULT_DATE)
  const [dateSinceActive, setDateSinceActive] = useState(!!parsed.since)
  const [dateUntil, setDateUntil] = useState(parsed.until || DEFAULT_DATE)
  const [dateUntilActive, setDateUntilActive] = useState(!!parsed.until)

  const [filters, setFilters] = useState<AdvancedFilter[]>(parsed.filters)
  const scrollRef = useRef<ScrollView>(null)
  const filtersSectionRef = useRef<View>(null)

  const suggestions = [
    {
      all: l({
        message: 'cats dogs',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “cows pigs”.',
      }),
      none: l({
        message: 'cows pigs',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “cats dogs”.',
      }),
    },
    {
      all: l({
        message: 'mustangs broncos',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “cars trucks”.',
      }),
      none: l({
        message: 'cars trucks',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “mustangs broncos”.',
      }),
    },
    {
      all: l({
        message: 'spring summer',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “fall winter”.',
      }),
      none: l({
        message: 'fall winter',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “spring summer”.',
      }),
    },
    {
      all: l({
        message: 'allegro vivace',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “lento adagio”.',
      }),
      none: l({
        message: 'lento adagio',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “allegro vivace”.',
      }),
    },
    {
      all: l({
        message: 'spaniels terriers',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “dachshunds pugs”.',
      }),
      none: l({
        message: 'dachshunds pugs',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “spaniels terriers”.',
      }),
    },
    {
      all: l({
        message: 'blue black',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “white gold”.',
      }),
      none: l({
        message: 'white gold',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “blue black”.',
      }),
    },
    {
      all: l({
        message: 'unstoppable force',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “immovable object”.',
      }),
      none: l({
        message: 'immovable object',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “unstoppable force”.',
      }),
    },
    {
      all: l({
        message: 'parsley sage',
        comment:
          'Advanced search: Example of an “all of these words” search. Paired with “rosemary thyme”.',
      }),
      none: l({
        message: 'rosemary thyme',
        comment:
          'Advanced search: Example of a “none of these words” search. Paired with “parsley sage”.',
      }),
    },
  ]

  // eslint-disable-next-line react/hook-use-state
  const [suggestion] = useState(() =>
    Math.floor(Math.random() * suggestions.length),
  )

  function addFilter() {
    if (filters.length >= MAX_FILTERS) return
    /*
     * New blocks append to the end so the newest sits directly above the
     * "Add filter" button, which renders below the list.
     */
    setFilters(prev => [...prev, makeFilter('authors')])
    ax.metric('search:addFilter:press', {
      filterCount: filters.length + 1,
    })
    /*
     * Wait for the new block to render, then scroll the bottom of the dialog
     * (the new block plus the button beneath it) into view.
     */
    requestAnimationFrame(() => {
      if (IS_WEB) {
        const node = filtersSectionRef.current as unknown as HTMLElement | null
        node?.scrollIntoView?.({behavior: 'smooth', block: 'end'})
      } else {
        scrollRef.current?.scrollToEnd({animated: true})
      }
    })
  }

  function updateFilter(id: string, patch: Partial<AdvancedFilter>) {
    setFilters(prev =>
      prev.map(filter => (filter.id === id ? {...filter, ...patch} : filter)),
    )
  }

  function removeFilter(id: string) {
    setFilters(prev => prev.filter(filter => filter.id !== id))
  }

  function handlePressSearch() {
    const {q: nextQ, filters: nextFilters} = serializeAdvancedSearch({
      query,
      exactPhrase,
      negatedWords,
      language,
      replies,
      media,
      following,
      dateSince,
      dateSinceActive,
      dateUntil,
      dateUntilActive,
      filters,
    })
    /*
     * Run the submit (navigation + state updates) inside the close callback so
     * it doesn't race the sheet's close animation on native.
     */
    control.close(() => onSubmit(nextQ, nextFilters))
  }

  function cancelButton() {
    return (
      <Button
        label={l`Cancel`}
        onPress={() => control.close()}
        size="small"
        color="secondary"
        variant="ghost"
        style={[a.rounded_full]}>
        <ButtonText>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    )
  }

  function searchButton() {
    return (
      <Button
        label={l`Search`}
        onPress={handlePressSearch}
        size="small"
        color="primary"
        style={[a.rounded_full]}>
        <ButtonText>
          <Trans>Search</Trans>
        </ButtonText>
      </Button>
    )
  }

  return (
    <Dialog.ScrollableInner
      ref={scrollRef}
      label={l`Dialog: Set advanced search options`}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={searchButton}>
          <Dialog.HeaderText>
            <Trans>Advanced search</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.mt_xl, a.px_xl, a.gap_xl]}>
        <View style={[a.flex_1]}>
          <TextField.LabelText>
            <Trans>All of these words</Trans>
          </TextField.LabelText>
          <ClearableInput
            label={l`Search query`}
            defaultValue={query}
            placeholder={suggestions[suggestion].all}
            onChangeText={setQuery}
            onSubmitEditing={handlePressSearch}
          />
        </View>

        <View style={[twoColumn ? a.flex_row : a.flex_col, a.gap_xl]}>
          <View style={[a.flex_1]}>
            <TextField.LabelText>
              <Trans>This exact phrase</Trans>
            </TextField.LabelText>
            <ClearableInput
              label={l`This exact phrase`}
              defaultValue={exactPhrase}
              placeholder={l({
                message: 'what’s up',
                comment: 'Advanced search: Example of an “exact phrase” search',
              })}
              onChangeText={setExactPhrase}
              onSubmitEditing={handlePressSearch}
            />
          </View>

          <View style={[a.flex_1]}>
            <TextField.LabelText>
              <Trans>None of these words</Trans>
            </TextField.LabelText>
            <ClearableInput
              label={l`None of these words`}
              defaultValue={negatedWords}
              placeholder={suggestions[suggestion].none}
              onChangeText={setNegatedWords}
              onSubmitEditing={handlePressSearch}
            />
          </View>
        </View>

        <View>
          <View style={[a.flex_row, a.gap_lg]}>
            <View style={[a.flex_1]}>
              <TextField.LabelText>
                <Trans>Since</Trans>
              </TextField.LabelText>
              <ClearableDateField
                label={l`Since`}
                value={dateSince}
                active={dateSinceActive}
                accessibilityHint={l({
                  message: 'Include posts made since this date',
                  comment: 'Advanced search filter',
                })}
                // Can't choose a Since later than an active Until.
                maximumDate={dateUntilActive ? dateUntil : DEFAULT_DATE}
                onConfirm={(value: string) => {
                  setDateSince(value)
                  setDateSinceActive(true)
                }}
                onClear={() => {
                  setDateSinceActive(false)
                  setDateSince(DEFAULT_DATE)
                }}
              />
            </View>
            <View style={[a.flex_1]}>
              <TextField.LabelText>
                <Trans>Until</Trans>
              </TextField.LabelText>
              <ClearableDateField
                label={l`Until`}
                value={dateUntil}
                active={dateUntilActive}
                accessibilityHint={l({
                  message: 'Include posts made until this date',
                  comment: 'Advanced search filter',
                })}
                // Can't choose an Until earlier than an active Since.
                minimumDate={dateSinceActive ? dateSince : undefined}
                onConfirm={(value: string) => {
                  setDateUntil(value)
                  setDateUntilActive(true)
                }}
                onClear={() => {
                  setDateUntilActive(false)
                  setDateUntil(DEFAULT_DATE)
                }}
              />
            </View>
          </View>
        </View>

        <View style={[twoColumn ? a.flex_row : a.flex_col, a.gap_lg]}>
          <View style={[a.flex_1]}>
            <Text
              style={[
                a.text_sm,
                a.font_medium,
                t.atoms.text_contrast_medium,
                a.mb_sm,
              ]}>
              <Trans>Language</Trans>
            </Text>
            <View style={[a.flex_row]}>
              <SearchLanguageDropdown
                showIcon={false}
                value={language}
                onChange={setLanguage}
              />
            </View>
          </View>
          <View style={[a.flex_1]}>
            <Text
              style={[
                a.text_sm,
                a.font_medium,
                t.atoms.text_contrast_medium,
                a.mb_sm,
              ]}>
              <Trans>Media</Trans>
            </Text>
            <View style={[a.flex_row]}>
              <MediaDropdown value={media} onChange={setMedia} />
            </View>
          </View>
        </View>

        <View style={[twoColumn ? a.flex_row : a.flex_col, a.gap_lg]}>
          <View style={[a.flex_1]}>
            <Text
              style={[
                a.text_sm,
                a.font_medium,
                t.atoms.text_contrast_medium,
                a.mb_sm,
              ]}>
              <Trans>Include</Trans>
            </Text>
            <View style={[a.flex_row]}>
              <RepliesDropdown value={replies} onChange={setReplies} />
            </View>
          </View>
          <View style={[a.flex_1]}>
            <Text
              style={[
                a.text_sm,
                a.font_medium,
                t.atoms.text_contrast_medium,
                a.mb_sm,
              ]}>
              <Trans>From</Trans>
            </Text>
            <View style={[a.flex_row]}>
              <FollowingDropdown value={following} onChange={setFollowing} />
            </View>
          </View>
        </View>

        <View ref={filtersSectionRef} style={[a.gap_md]}>
          {filters.map(filter => (
            <FilterBlock
              key={filter.id}
              filter={filter}
              onChange={patch => updateFilter(filter.id, patch)}
              onSubmitEditing={handlePressSearch}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
          {filters.length >= MAX_FILTERS && (
            <Admonition type="info">
              <Trans>
                You’ve reached the maximum of{' '}
                <Plural value={MAX_FILTERS} one="# filter" other="# filters" />.
                Add more values to an existing filter instead of creating new
                ones.
              </Trans>
            </Admonition>
          )}
          <Button
            label={l`Add an additional search filter`}
            size="small"
            color="secondary"
            disabled={filters.length >= MAX_FILTERS}
            style={[a.mt_sm]}
            onPress={addFilter}>
            <ButtonIcon icon={PlusIcon} />
            <ButtonText>
              <Trans>Add filter</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
