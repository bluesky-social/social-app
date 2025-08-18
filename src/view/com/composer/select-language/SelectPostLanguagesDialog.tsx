import {useCallback} from 'react'
import React from 'react'
import {Dimensions, ScrollView, View} from 'react-native'
import {Keyboard} from 'react-native'
import {msg} from '@lingui/macro'
import {Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {LANG_DROPDOWN_HITSLOP} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {deviceLanguageCodes} from '#/locale/deviceLocales'
import {languageName} from '#/locale/helpers'
import {LANGUAGES, LANGUAGES_MAP_CODE2} from '#/locale/languages'
import {isNative} from '#/platform/detection'
import {toPostLanguages, useLanguagePrefs} from '#/state/preferences/languages'
import {useLanguagePrefsApi} from '#/state/preferences/languages'
import {ConfirmLanguagesButton} from '#/view/com/modals/lang-settings/ConfirmLanguagesButton'
import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Text} from '#/components/Typography'
import {codeToLanguageName} from '../../../../locale/helpers'

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
        label={_(msg`Post language selection`)}
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
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <PostLanguagesSettingsDialogInner onClose={control.close} />
      <Dialog.Close />
    </Dialog.Outer>
  )
}

export function PostLanguagesSettingsDialogInner({
  onClose,
}: {
  onClose: () => void
}) {
  const langPrefs = useLanguagePrefs()
  const [toggleList, setToggleList] = React.useState<string[]>(
    langPrefs.postLanguage.split(',') || [langPrefs.primaryLanguage],
  )
  const setLangPrefs = useLanguagePrefsApi()
  const t = useTheme()
  const {isMobile} = useWebMediaQueries()

  const onPressDone = React.useCallback(() => {
    let langsString = toggleList.join(',')

    if (!langsString) {
      langsString = langPrefs.primaryLanguage
    }

    setLangPrefs.setPostLanguage(langsString)
    onClose()
  }, [onClose, toggleList, langPrefs.primaryLanguage, setLangPrefs])

  const languages = React.useMemo(() => {
    const langs = LANGUAGES.filter(
      lang =>
        !!lang.code2.trim() &&
        LANGUAGES_MAP_CODE2[lang.code2].code3 === lang.code3,
    )
    // sort so that device & selected languages are on top, then alphabetically
    langs.sort((langA, langB) => {
      const hasA =
        toggleList.includes(langA.code2) ||
        deviceLanguageCodes.includes(langA.code2)
      const hasB =
        toggleList.includes(langB.code2) ||
        deviceLanguageCodes.includes(langB.code2)
      if (hasA === hasB) return langA.name.localeCompare(langB.name)
      if (hasA) return -1
      return 1
    })
    return langs
  }, [toggleList])

  const deviceHeight = Dimensions.get('window').height

  return (
    <Dialog.ScrollableInner
      accessibilityLabelledBy="dialog-title"
      accessibilityDescribedBy="dialog-description">
      <View
        testID="postLanguagesDialog"
        style={[
          t.atoms.bg,
          a.flex_1,
          a.px_sm,
          isMobile ? [a.pt_xl] : [a.pt_lg, {maxHeight: deviceHeight * 0.7}],
        ]}>
        <Text
          nativeID="dialog-title"
          style={[
            t.atoms.text,
            a.text_left,
            a.font_bold,
            a.text_2xl,
            a.mb_sm,
            a.px_0,
          ]}>
          <Trans>Post Languages</Trans>
        </Text>

        <Text
          nativeID="dialog-description"
          style={[
            t.atoms.text,
            a.text_left,
            a.px_0,
            a.mb_sm,
            a.pb_lg,
            a.text_md,
          ]}>
          <Trans>Which languages are used in this post?</Trans>
        </Text>

        <View style={[a.flex_1, {maxHeight: isMobile ? '72%' : '75%'}]}>
          <ScrollView
            style={[
              a.flex_1,
              a.px_0,
              a.gap_sm,
              {maxHeight: deviceHeight * 0.8},
            ]}>
            <Toggle.Group
              onChange={setToggleList}
              values={toggleList}
              label={'languageSelection'}
              maxSelections={3}>
              {languages.map(lang => (
                <Toggle.Item
                  key={lang.code2}
                  name={lang.code2}
                  label={languageName(lang, langPrefs.appLanguage)}
                  style={[
                    t.atoms.border_contrast_low,
                    a.border_t,
                    a.rounded_0,
                    a.px_0,
                    a.py_md,
                  ]}>
                  <Toggle.LabelText style={[a.flex_1]}>
                    {languageName(lang, langPrefs.appLanguage)}
                  </Toggle.LabelText>
                  <Toggle.Switch />
                </Toggle.Item>
              ))}
            </Toggle.Group>
            <View style={[{height: isMobile ? 60 : 0}]} />
          </ScrollView>
        </View>
        <ConfirmLanguagesButton onPress={onPressDone} />
      </View>
    </Dialog.ScrollableInner>
  )
}
