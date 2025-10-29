import {useCallback, useMemo, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {languageName} from '#/locale/helpers'
import {type Language, LANGUAGES, LANGUAGES_MAP_CODE2} from '#/locale/languages'
import {isNative, isWeb} from '#/platform/detection'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {SearchInput} from '#/components/forms/SearchInput'
import * as Toggle from '#/components/forms/Toggle'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Text} from '#/components/Typography'

export function PostLanguageSelectDialog({
  control,
  /**
   * Optionally can be passed to show different values than what is saved in
   * langPrefs.
   */
  currentLanguages,
  onSelectLanguage,
}: {
  control: Dialog.DialogControlProps
  currentLanguages?: string[]
  onSelectLanguage?: (language: string) => void
}) {
  const {height} = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const renderErrorBoundary = useCallback(
    (error: any) => <DialogError details={String(error)} />,
    [],
  )

  return (
    <Dialog.Outer
      control={control}
      nativeOptions={{minHeight: height - insets.top}}>
      <Dialog.Handle />
      <ErrorBoundary renderError={renderErrorBoundary}>
        <DialogInner
          currentLanguages={currentLanguages}
          onSelectLanguage={onSelectLanguage}
        />
      </ErrorBoundary>
    </Dialog.Outer>
  )
}

export function DialogInner({
  currentLanguages,
  onSelectLanguage,
}: {
  currentLanguages?: string[]
  onSelectLanguage?: (language: string) => void
}) {
  const control = Dialog.useDialogContext()
  const [headerHeight, setHeaderHeight] = useState(0)

  const allowedLanguages = useMemo(() => {
    const uniqueLanguagesMap = LANGUAGES.filter(lang => !!lang.code2).reduce(
      (acc, lang) => {
        acc[lang.code2] = lang
        return acc
      },
      {} as Record<string, Language>,
    )

    return Object.values(uniqueLanguagesMap)
  }, [])

  const langPrefs = useLanguagePrefs()
  const postLanguagesPref =
    currentLanguages ?? toPostLanguages(langPrefs.postLanguage)

  const [checkedLanguagesCode2, setCheckedLanguagesCode2] = useState<string[]>(
    postLanguagesPref || [langPrefs.primaryLanguage],
  )
  const [search, setSearch] = useState('')

  const setLangPrefs = useLanguagePrefsApi()
  const t = useTheme()
  const {_} = useLingui()

  const handleClose = () => {
    control.close(() => {
      let langsString = checkedLanguagesCode2.join(',')
      if (!langsString) {
        langsString = langPrefs.primaryLanguage
      }
      setLangPrefs.setPostLanguage(langsString)
      onSelectLanguage?.(langsString)
    })
  }

  // NOTE(@elijaharita): Displayed languages are split into 3 lists for
  // ordering.
  const displayedLanguages = useMemo(() => {
    function mapCode2List(code2List: string[]) {
      return code2List.map(code2 => LANGUAGES_MAP_CODE2[code2]).filter(Boolean)
    }

    // NOTE(@elijaharita): Get recent language codes and map them to language
    // objects. Both the user account's saved language history and the current
    // checked languages are displayed here.
    const recentLanguagesCode2 =
      Array.from(
        new Set([...checkedLanguagesCode2, ...langPrefs.postLanguageHistory]),
      ).slice(0, 5) || []
    const recentLanguages = mapCode2List(recentLanguagesCode2)

    // NOTE(@elijaharita): helper functions
    const matchesSearch = (lang: Language) =>
      lang.name.toLowerCase().includes(search.toLowerCase())
    const isChecked = (lang: Language) =>
      checkedLanguagesCode2.includes(lang.code2)
    const isInRecents = (lang: Language) =>
      recentLanguagesCode2.includes(lang.code2)

    const checkedRecent = recentLanguages.filter(isChecked)

    if (search) {
      // NOTE(@elijaharita): if a search is active, we ALWAYS show checked
      // items, as well as any items that match the search.
      const uncheckedRecent = recentLanguages
        .filter(lang => !isChecked(lang))
        .filter(matchesSearch)
      const unchecked = allowedLanguages.filter(lang => !isChecked(lang))
      const all = unchecked
        .filter(matchesSearch)
        .filter(lang => !isInRecents(lang))

      return {
        all,
        checkedRecent,
        uncheckedRecent,
      }
    } else {
      // NOTE(@elijaharita): if no search is active, we show everything.
      const uncheckedRecent = recentLanguages.filter(lang => !isChecked(lang))
      const all = allowedLanguages
        .filter(lang => !recentLanguagesCode2.includes(lang.code2))
        .filter(lang => !isInRecents(lang))

      return {
        all,
        checkedRecent,
        uncheckedRecent,
      }
    }
  }, [
    allowedLanguages,
    search,
    langPrefs.postLanguageHistory,
    checkedLanguagesCode2,
  ])

  const listHeader = (
    <View
      style={[a.pb_xs, t.atoms.bg, isNative && a.pt_2xl]}
      onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}>
      <View style={[a.flex_row, a.w_full, a.justify_between]}>
        <View>
          <Text
            nativeID="dialog-title"
            style={[
              t.atoms.text,
              a.text_left,
              a.font_semi_bold,
              a.text_xl,
              a.mb_sm,
            ]}>
            <Trans>Choose Post Languages</Trans>
          </Text>
          <Text
            nativeID="dialog-description"
            style={[
              t.atoms.text_contrast_medium,
              a.text_left,
              a.text_md,
              a.mb_lg,
            ]}>
            <Trans>Select up to 3 languages used in this post</Trans>
          </Text>
        </View>

        {isWeb && (
          <Button
            variant="ghost"
            size="small"
            color="secondary"
            shape="round"
            label={_(msg`Close dialog`)}
            onPress={handleClose}>
            <ButtonIcon icon={XIcon} />
          </Button>
        )}
      </View>

      <View style={[a.w_full, a.flex_row, a.align_stretch, a.gap_xs, a.pb_0]}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder={_(msg`Search languages`)}
          label={_(msg`Search languages`)}
          maxLength={50}
          onClearText={() => setSearch('')}
        />
      </View>
    </View>
  )

  const isCheckedRecentEmpty =
    displayedLanguages.checkedRecent.length > 0 ||
    displayedLanguages.uncheckedRecent.length > 0

  const isDisplayedLanguagesEmpty = displayedLanguages.all.length === 0

  const flatListData = [
    ...(isCheckedRecentEmpty
      ? [{type: 'header', label: _(msg`Recently used`)}]
      : []),
    ...displayedLanguages.checkedRecent.map(lang => ({type: 'item', lang})),
    ...displayedLanguages.uncheckedRecent.map(lang => ({type: 'item', lang})),
    ...(isDisplayedLanguagesEmpty
      ? []
      : [{type: 'header', label: _(msg`All languages`)}]),
    ...displayedLanguages.all.map(lang => ({type: 'item', lang})),
  ]

  return (
    <Toggle.Group
      values={checkedLanguagesCode2}
      onChange={setCheckedLanguagesCode2}
      type="checkbox"
      maxSelections={3}
      label={_(msg`Select languages`)}
      style={web([a.contents])}>
      <Dialog.InnerFlatList
        data={flatListData}
        ListHeaderComponent={listHeader}
        stickyHeaderIndices={[0]}
        contentContainerStyle={[a.gap_0]}
        style={[isNative && a.px_lg, web({paddingBottom: 120})]}
        scrollIndicatorInsets={{top: headerHeight}}
        renderItem={({item, index}) => {
          if (item.type === 'header') {
            return (
              <Text
                key={index}
                style={[
                  a.px_0,
                  a.py_md,
                  a.font_semi_bold,
                  a.text_xs,
                  t.atoms.text_contrast_low,
                  a.pt_3xl,
                ]}>
                {item.label}
              </Text>
            )
          }
          const lang = item.lang

          return (
            <Toggle.Item
              key={lang.code2}
              name={lang.code2}
              label={languageName(lang, langPrefs.appLanguage)}
              style={[
                t.atoms.border_contrast_low,
                a.border_b,
                a.rounded_0,
                a.px_0,
                a.py_md,
              ]}>
              <Toggle.LabelText style={[a.flex_1]}>
                {languageName(lang, langPrefs.appLanguage)}
              </Toggle.LabelText>
              <Toggle.Checkbox />
            </Toggle.Item>
          )
        }}
        footer={
          <Dialog.FlatListFooter>
            <Button
              label={_(msg`Close dialog`)}
              onPress={handleClose}
              color="primary"
              size="large">
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </Dialog.FlatListFooter>
        }
      />
    </Toggle.Group>
  )
}

function DialogError({details}: {details?: string}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()

  return (
    <Dialog.ScrollableInner
      style={a.gap_md}
      label={_(msg`An error has occurred`)}>
      <Dialog.Close />
      <ErrorScreen
        title={_(msg`Oh no!`)}
        message={_(
          msg`There was an unexpected issue in the application. Please let us know if this happened to you!`,
        )}
        details={details}
      />
      <Button
        label={_(msg`Close dialog`)}
        onPress={() => control.close()}
        color="primary"
        size="large">
        <ButtonText>
          <Trans>Close</Trans>
        </ButtonText>
      </Button>
    </Dialog.ScrollableInner>
  )
}
