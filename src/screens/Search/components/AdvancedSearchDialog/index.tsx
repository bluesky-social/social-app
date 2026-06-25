import {useMemo, useRef, useState} from 'react'
import {findNodeHandle, type ScrollView, View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {
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
import {IS_WEB} from '#/env'
import {SearchLanguageDropdown} from '../SearchLanguageDropdown'
import {ClearableDateField, DEFAULT_DATE} from './ClearableDateField'
import {ClearableInput} from './ClearableInput'
import {FilterBlock} from './FilterBlock'
import {RepliesDropdown} from './RepliesDropdown'
import {ToggleRow} from './ToggleRow'
import {
  type AdvancedFilter,
  makeFilter,
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
          onPress={control.open}>
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
  const [anyWords, setAnyWords] = useState(parsed.anyWords)
  const [negatedWords, setNegatedWords] = useState(parsed.negatedWords)
  const [language, setLanguage] = useState(parsed.language)

  const [hasMedia, setHasMedia] = useState(parsed.hasMedia)
  const [hasVideo, setHasVideo] = useState(parsed.hasVideo)
  const [replies, setReplies] = useState<RepliesFilter>(parsed.replies)
  const [following, setFollowing] = useState(parsed.following)

  // The date picker requires a valid date, so these always hold one. The
  // accompanying `active` flags track whether the date is actually part of the
  // query, so that a date equal to today (the default) can still be applied.
  const [dateSince, setDateSince] = useState(parsed.since || DEFAULT_DATE)
  const [dateSinceActive, setDateSinceActive] = useState(!!parsed.since)
  const [dateUntil, setDateUntil] = useState(parsed.until || DEFAULT_DATE)
  const [dateUntilActive, setDateUntilActive] = useState(!!parsed.until)

  const [filters, setFilters] = useState<AdvancedFilter[]>(parsed.filters)
  const scrollRef = useRef<ScrollView>(null)
  const filtersSectionRef = useRef<View>(null)

  function addFilter() {
    if (filters.length >= MAX_FILTERS) return
    setFilters(prev => [makeFilter('authors'), ...prev])
    // Wait for the new block to render, then bring the section into view.
    requestAnimationFrame(() => {
      if (IS_WEB) {
        const node = filtersSectionRef.current as unknown as HTMLElement | null
        node?.scrollIntoView?.({behavior: 'smooth', block: 'start'})
      } else {
        const scrollNode = findNodeHandle(scrollRef.current)
        if (!scrollNode) return
        filtersSectionRef.current?.measureLayout(
          scrollNode,
          (_x, y) => {
            scrollRef.current?.scrollTo({y, animated: true})
          },
          () => {},
        )
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
      anyWords,
      negatedWords,
      language,
      replies,
      hasMedia,
      hasVideo,
      following,
      dateSince,
      dateSinceActive,
      dateUntil,
      dateUntilActive,
      filters,
    })
    // Run the submit (navigation + state updates) inside the close callback so
    // it doesn't race the sheet's close animation on native.
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
        <View style={[twoColumn ? a.flex_row : a.flex_col, a.gap_xl]}>
          <View style={[a.flex_1]}>
            <TextField.LabelText>
              <Trans>All of these words</Trans>
            </TextField.LabelText>
            <ClearableInput
              label={l`Search query`}
              defaultValue={query}
              placeholder={l({
                message: 'bluesky atproto',
                comment:
                  'Advanced search: Example of an “all of these words” search',
              })}
              onChangeText={setQuery}
              onSubmitEditing={handlePressSearch}
            />
          </View>

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
        </View>

        <View style={[twoColumn ? a.flex_row : a.flex_col, a.gap_xl]}>
          <View style={[a.flex_1]}>
            <TextField.LabelText>
              <Trans>Any of these words</Trans>
            </TextField.LabelText>
            <ClearableInput
              label={l`Any of these words`}
              defaultValue={anyWords}
              placeholder={l({
                message: 'cats dogs',
                comment:
                  'Advanced search: Example of an “any of these words” search',
              })}
              onChangeText={setAnyWords}
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
              placeholder={l({
                message: 'cows pigs',
                comment:
                  'Advanced search: Example of an “none of these words” search',
              })}
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

        <View style={[a.flex_row, a.gap_lg]}>
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
              <Trans>Include</Trans>
            </Text>
            <View style={[a.flex_row]}>
              <RepliesDropdown value={replies} onChange={setReplies} />
            </View>
          </View>
        </View>

        <View ref={filtersSectionRef} style={[a.gap_md]}>
          <Text style={[a.font_bold, a.text_md]}>
            <Trans>Additional filters</Trans>
          </Text>
          <ToggleRow
            name="has_media"
            label={l({
              message: 'Only posts with images',
              comment: 'Advanced search filter',
            })}
            value={hasMedia}
            onChange={setHasMedia}
          />
          <ToggleRow
            name="has_video"
            label={l({
              message: 'Only posts with video',
              comment: 'Advanced search filter',
            })}
            value={hasVideo}
            onChange={setHasVideo}
          />
          <ToggleRow
            name="following"
            label={l({
              message: 'Only posts from people you follow',
              comment: 'Advanced search filter',
            })}
            value={following}
            onChange={setFollowing}
          />
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
          {filters.map(filter => (
            <FilterBlock
              key={filter.id}
              filter={filter}
              onChange={patch => updateFilter(filter.id, patch)}
              onSubmitEditing={handlePressSearch}
              onRemove={() => removeFilter(filter.id)}
            />
          ))}
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
