import React, {useCallback, useMemo} from 'react'
import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LANG_DROPDOWN_HITSLOP} from '#/lib/constants'
import {languageName} from '#/locale/helpers'
import {Language, LANGUAGES, LANGUAGES_MAP_CODE2} from '#/locale/languages'
import {isNative} from '#/platform/detection'
import {
  toPostLanguages,
  useLanguagePrefs,
  useLanguagePrefsApi,
} from '#/state/preferences/languages'
import {atoms as a, tokens, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {WEB_DIALOG_HEIGHT} from '#/components/Dialog/index.web'
import {SearchInput} from '#/components/forms/SearchInput'
import * as Toggle from '#/components/forms/Toggle'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'
import {codeToLanguageName} from '../../../../locale/helpers'
import {ErrorScreen} from '../../util/error/ErrorScreen'
import {ErrorBoundary} from '../../util/ErrorBoundary'

const WEB_DIALOG_WIDTH = 600
const MOBILE_DIALOG_WIDTH = '100%'

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
              a.leading_snug,
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
  const {gtMobile} = useBreakpoints()

  const renderErrorBoundary = useCallback(
    (error: any) => <DialogError details={String(error)} />,
    [],
  )

  return (
    <Dialog.Outer control={control}>
      <View
        style={[
          a.rounded_2xs,
          web({
            maxWidth: gtMobile ? MOBILE_DIALOG_WIDTH : WEB_DIALOG_WIDTH,
            width: gtMobile ? WEB_DIALOG_WIDTH : MOBILE_DIALOG_WIDTH,
          }),
        ]}>
        <Dialog.Handle />
        <ErrorBoundary renderError={renderErrorBoundary}>
          <PostLanguagesSettingsDialogInner onClose={control.close} />
        </ErrorBoundary>
      </View>
    </Dialog.Outer>
  )
}

export function PostLanguagesSettingsDialogInner({
  onClose,
}: {
  onClose: () => void
}) {
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
  const [checkedLanguagesCode2, setCheckedLanguagesCode2] = React.useState<
    string[]
  >(langPrefs.postLanguage.split(',') || [langPrefs.primaryLanguage])
  const [search, setSearch] = React.useState('')
  const showSearchCancel = search.length > 0

  const setLangPrefs = useLanguagePrefsApi()
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
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
      style={[
        {
          paddingBottom: tokens.space.xs,
          backgroundColor: t.atoms.bg.backgroundColor,
        },
        isNative && a.pt_2xl,
      ]}>
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
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder={_(msg`Search languages`)}
            label={_(msg`Search languages`)}
            maxLength={50}
          />
        </View>
        {showSearchCancel && (
          <Button
            label={_(msg`Cancel`)}
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
    <>
      <View
        style={[
          web({
            width: gtMobile ? WEB_DIALOG_WIDTH : MOBILE_DIALOG_WIDTH,
            position: a.relative,
            minWidth: gtMobile ?? '90%',
            alignSelf: 'center',
          }),
          web(a.flex_1),
          isNative && {
            flexGrow: 1,
            minHeight: '100%',
          },
        ]}>
        <View
          style={[
            a.absolute,
            a.left_0,
            {right: tokens.space.sm, top: tokens.space.xs},
            a.z_10,
          ]}>
          <Dialog.Close />
        </View>

        <Toggle.Group
          values={checkedLanguagesCode2}
          onChange={setCheckedLanguagesCode2}
          type="checkbox"
          maxSelections={3}
          label={_(msg`Select languages`)}>
          <Dialog.InnerFlatList
            ref={listRef}
            data={flatListData}
            ListHeaderComponent={listHeader}
            stickyHeaderIndices={[0]}
            contentContainerStyle={[a.gap_0]}
            style={[
              isNative && a.px_lg,
              web({
                height: WEB_DIALOG_HEIGHT,
                // TODO(@apiligrim): hard coded
                paddingBottom: 120,
              }),
            ]}
            renderItem={({item, index}) => {
              if (item.type === 'header') {
                return (
                  <Text
                    key={index}
                    style={[
                      a.px_0,
                      a.py_md,
                      a.font_bold,
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
          />
          <View
            style={[
              a.absolute,
              a.left_0,
              a.right_0,
              a.bottom_0,
              isNative ? a.px_md : a.px_2xl,
              a.z_10,
              t.atoms.bg,
              a.pt_xl,
              isNative ? a.border_t : a.border,
              t.atoms.border_contrast_low,
              {
                width: gtMobile ? WEB_DIALOG_WIDTH : MOBILE_DIALOG_WIDTH,
                // maxWidth: WEB_DIALOG_WIDTH,
                paddingBottom: isNative ? 48 : tokens.space._2xl,
                borderBottomLeftRadius: a.rounded_md.borderRadius,
                borderBottomRightRadius: a.rounded_md.borderRadius,
              },
            ]}>
            <Button
              label={_(msg`Close dialog`)}
              onPress={() => {
                let langsString = checkedLanguagesCode2.join(',')
                if (!langsString) {
                  langsString = langPrefs.primaryLanguage
                }
                setLangPrefs.setPostLanguage(langsString)
                onClose()
              }}
              color="primary"
              size="large">
              <ButtonText>
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </View>
        </Toggle.Group>
      </View>
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
