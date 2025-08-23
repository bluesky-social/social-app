import {atoms as a, useTheme, web, useBreakpoints} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {codeToLanguageName} from '../../../../locale/helpers'
import {ConfirmLanguagesButton} from '../../modals/lang-settings/ConfirmLanguagesButton'
import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {ErrorBoundary} from '../../util/ErrorBoundary'
import {ErrorScreen} from '../../util/error/ErrorScreen'
import {isNative} from '#/platform/detection'
import {Keyboard, ViewStyle} from 'react-native'
import {LANG_DROPDOWN_HITSLOP} from '#/lib/constants'
import {languageName} from '#/locale/helpers'
import {Language, LANGUAGES, LANGUAGES_MAP_CODE2} from '#/locale/languages'
import {msg} from '@lingui/macro'
import {Text} from '#/components/Typography'
import {toPostLanguages, useLanguagePrefs} from '#/state/preferences/languages'
import {Trans} from '@lingui/macro'
import {useCallback, useMemo} from 'react'
import {useLanguagePrefsApi} from '#/state/preferences/languages'
import {useLingui} from '@lingui/react'
import {View} from 'react-native'
import {MagnifyingGlassIcon} from '#/lib/icons'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import React from 'react'
import {StyleProp} from 'react-native'
import {Palette} from '#/view/screens/Storybook/Palette'

const HEADER_HEIGHT = 72
const SEARCH_HEIGHT = 48
const WEB_DIALOG_WIDTH = 600

export function SelectPostLanguagesBtn() {
  const {_} = useLingui()
  const langPrefs = useLanguagePrefs()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const onPressMore = useCallback(async () => {
    if (isNative) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
      }
    }
    control.open()
  }, [control])

  const postLanguagesPref = toPostLanguages(langPrefs.postLanguage)

  return (
    <>
      <Button
        testID="selectLangBtn"
        onPress={onPressMore}
        size="small"
        hitSlop={LANG_DROPDOWN_HITSLOP}
        label={_(
          msg({
            message: `Post language selection`,
            comment: `Accessibility label for button that opens dialog to choose post language settings`,
          }),
        )}
        accessibilityHint={_(msg`Opens post language settings`)}
        style={[a.mx_md]}>
        {postLanguagesPref.length > 0 ? (
          <Text
            style={[
              {color: t.palette.primary_500},
              a.font_bold,
              a.text_sm,
              {maxWidth: 100},
            ]}
            numberOfLines={1}>
            {postLanguagesPref
              .map(lang => codeToLanguageName(lang, langPrefs.appLanguage))
              .join(', ')}
          </Text>
        ) : (
          <GlobeIcon size="xs" style={[{color: t.palette.primary_500}]} />
        )}
      </Button>

      <LanguageDialog control={control} />
    </>
  )
}

function LanguageDialog({control}: {control: Dialog.DialogControlProps}) {
  return (
    <Dialog.Outer
      control={control}
      style={[
        a.rounded_2xs,
        web({
          width: WEB_DIALOG_WIDTH,
          maxWidth: WEB_DIALOG_WIDTH,
          margin: 'auto',
          alignSelf: 'center',
        }),
      ]}>
      <Dialog.Handle />
      <PostLanguagesSettingsDialogInner onClose={control.close} />
    </Dialog.Outer>
  )
}

export function PostLanguagesSettingsDialogInner({
  onClose,
}: {
  onClose: () => void
}) {
  const allowedLanguages = useMemo(
    () => LANGUAGES.filter(lang => !!lang.code2),
    [LANGUAGES],
  )

  const langPrefs = useLanguagePrefs()
  const [checkedLanguagesCode2, setCheckedLanguagesCode2] = React.useState<
    string[]
  >(langPrefs.postLanguage.split(',') || [langPrefs.primaryLanguage])
  const [search, setSearch] = React.useState('')
  const showSearchCancel = search.length > 0

  const setLangPrefs = useLanguagePrefsApi()
  const t = useTheme()
  const listRef = React.useRef(null)

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
      style={{
        paddingBottom: 8,
        backgroundColor: t.palette.white,
      }}>
      <Text
        nativeID="dialog-title"
        style={[t.atoms.text, a.text_left, a.font_bold, a.text_xl, a.mb_sm]}>
        <Trans>Choose Post Languages</Trans>
      </Text>
      <Text
        nativeID="dialog-description"
        style={[t.atoms.text_contrast_medium, a.text_left, a.text_md, a.mb_lg]}>
        <Trans>Select up to 3 languages used in this post</Trans>
      </Text>
      <View style={[a.w_full, a.flex_row, a.align_stretch, a.gap_xs, a.pb_0]}>
        <View style={[a.flex_1, a.relative]}>
          <TextField.Root>
            <TextField.Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search languages"
              style={[a.pl_xl]}
              maxLength={50}
              label="Search languages"
            />
            <View
              style={[
                a.absolute,
                a.left_md,
                a.top_0,
                a.bottom_0,
                a.justify_center,
                a.pl_0,
                a.z_10,
                {pointerEvents: 'none'},
              ]}>
              <MagnifyingGlassIcon
                strokeWidth={3}
                size={16}
                style={{
                  color:
                    search.length > 0
                      ? t.palette.primary_500
                      : t.atoms.text_contrast_low.color,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              />
            </View>
          </TextField.Root>
        </View>
        {showSearchCancel && (
          <Button
            label="Cancel"
            size="small"
            variant="ghost"
            color="secondary"
            style={[a.px_sm]}
            onPress={() => setSearch('')}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    </View>
  )

  const flatListData = [
    {type: 'header', label: 'Recently used'},
    ...displayedLanguages.checkedRecent.map(lang => ({type: 'item', lang})),
    ...displayedLanguages.uncheckedRecent.map(lang => ({type: 'item', lang})),
    {type: 'header', label: 'All languages'},
    ...displayedLanguages.all.map(lang => ({type: 'item', lang})),
  ]

  return (
    <>
      <Dialog.Close />
      <ErrorBoundary
        renderError={error => <DialogError details={String(error)} />}>
        <View
          style={[
            a.flex_1,
            web({width: WEB_DIALOG_WIDTH, maxWidth: WEB_DIALOG_WIDTH}),
            {
              position: a.relative,
            },
          ]}>
          <Toggle.Group
            values={checkedLanguagesCode2}
            onChange={setCheckedLanguagesCode2}
            type="checkbox"
            maxSelections={3}
            label="languageSelection">
            <Dialog.InnerFlatList
              ref={listRef}
              data={flatListData}
              renderItem={({item, index}) => {
                if (item.type === 'header') {
                  const isAllLanguages = item.label === 'All languages'

                  return (
                    <Text
                      style={[
                        a.px_0,
                        a.py_md,
                        a.font_bold,
                        a.text_xs,
                        t.atoms.text_contrast_low,
                        a.pt_2xl,
                        isAllLanguages ? a.pt_2xl : a.pt_xl,
                      ]}>
                      <Trans>{item.label}</Trans>
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
              ListHeaderComponent={listHeader}
              stickyHeaderIndices={[0]}
              contentContainerStyle={[a.gap_0, a.pb_5xl, {paddingBottom: 268}]}
              style={[
                web({width: WEB_DIALOG_WIDTH, maxWidth: WEB_DIALOG_WIDTH}),
                web(a.h_full_vh),
              ]}
              // keyboardDismissMode="on-drag"
            />
          </Toggle.Group>
          <View
            style={[
              a.absolute,
              a.left_0,
              a.right_0,
              a.bottom_0,
              a.px_2xl,
              a.pb_2xl,
              a.z_10,
              {
                backgroundColor: t.palette.white,
                borderBottomLeftRadius: a.rounded_lg.borderRadius,
                borderBottomRightRadius: a.rounded_lg.borderRadius,
              },
            ]}>
            <ConfirmLanguagesButton
              onPress={() => {
                let langsString = checkedLanguagesCode2.join(',')
                if (!langsString) {
                  langsString = langPrefs.primaryLanguage
                }
                setLangPrefs.setPostLanguage(langsString)
                onClose()
              }}
            />
          </View>
        </View>
      </ErrorBoundary>
    </>
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
