import {useCallback, useState} from 'react'
import {Keyboard, type StyleProp, View, type ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {useEnforceMaxGraphemeCount} from '#/lib/strings/helpers'
import {LANGUAGES} from '#/locale/languages'
import {isWeb} from '#/platform/detection'
import {useLanguagePrefs} from '#/state/preferences'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CC_Stroke2_Corner0_Rounded as CCIcon} from '#/components/icons/CC'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {TimesLarge_Stroke2_Corner0_Rounded as X} from '#/components/icons/Times'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Text} from '#/components/Typography'
import {SubtitleFilePicker} from './SubtitleFilePicker'

const MAX_NUM_CAPTIONS = 1

type CaptionsTrack = {lang: string; file: File}

interface Props {
  defaultAltText: string
  captions: CaptionsTrack[]
  saveAltText: (altText: string) => void
  setCaptions: (updater: (prev: CaptionsTrack[]) => CaptionsTrack[]) => void
}

export function SubtitleDialogBtn(props: Props) {
  const control = Dialog.useDialogControl()
  const {_} = useLingui()

  return (
    <View style={[a.flex_row, a.my_xs]}>
      <Button
        label={isWeb ? _(msg`Captions & alt text`) : _(msg`Alt text`)}
        accessibilityHint={
          isWeb
            ? _(msg`Opens captions and alt text dialog`)
            : _(msg`Opens alt text dialog`)
        }
        size="small"
        color="secondary"
        variant="ghost"
        onPress={() => {
          if (Keyboard.isVisible()) Keyboard.dismiss()
          control.open()
        }}>
        <ButtonIcon icon={CCIcon} />
        <ButtonText>
          {isWeb ? <Trans>Captions & alt text</Trans> : <Trans>Alt text</Trans>}
        </ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <SubtitleDialogInner {...props} />
      </Dialog.Outer>
    </View>
  )
}

function SubtitleDialogInner({
  defaultAltText,
  saveAltText,
  captions,
  setCaptions,
}: Props) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const enforceLen = useEnforceMaxGraphemeCount()
  const {primaryLanguage} = useLanguagePrefs()

  const [altText, setAltText] = useState(defaultAltText)

  const handleSelectFile = useCallback(
    (file: File) => {
      setCaptions(subs => [
        ...subs,
        {
          lang: subs.some(s => s.lang === primaryLanguage)
            ? ''
            : primaryLanguage,
          file,
        },
      ])
    },
    [setCaptions, primaryLanguage],
  )

  const subtitleMissingLanguage = captions.some(sub => sub.lang === '')

  return (
    <Dialog.ScrollableInner label={_(msg`Video settings`)}>
      <View style={a.gap_md}>
        <Text style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
          <Trans>Alt text</Trans>
        </Text>
        <TextField.Root>
          <Dialog.Input
            label={_(msg`Alt text`)}
            placeholder={_(msg`Add alt text (optional)`)}
            value={altText}
            onChangeText={evt => setAltText(enforceLen(evt, MAX_ALT_TEXT))}
            maxLength={MAX_ALT_TEXT * 10}
            multiline
            style={{maxHeight: 300}}
            numberOfLines={3}
            onKeyPress={({nativeEvent}) => {
              if (nativeEvent.key === 'Escape') {
                control.close()
              }
            }}
          />
        </TextField.Root>

        {isWeb && (
          <>
            <View
              style={[
                a.border_t,
                a.w_full,
                t.atoms.border_contrast_medium,
                a.my_md,
              ]}
            />
            <Text style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
              <Trans>Captions (.vtt)</Trans>
            </Text>
            <SubtitleFilePicker
              onSelectFile={handleSelectFile}
              disabled={
                subtitleMissingLanguage || captions.length >= MAX_NUM_CAPTIONS
              }
            />
            <View>
              {captions.map((subtitle, i) => (
                <SubtitleFileRow
                  key={subtitle.lang}
                  language={subtitle.lang}
                  file={subtitle.file}
                  setCaptions={setCaptions}
                  otherLanguages={LANGUAGES.filter(
                    lang =>
                      langCode(lang) === subtitle.lang ||
                      !captions.some(s => s.lang === langCode(lang)),
                  )}
                  style={[i % 2 === 0 && t.atoms.bg_contrast_25]}
                />
              ))}
            </View>
            {subtitleMissingLanguage && (
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>
                  Ensure you have selected a language for each subtitle file.
                </Trans>
              </Text>
            )}
          </>
        )}

        <View style={web([a.flex_row, a.justify_end])}>
          <Button
            label={_(msg`Done`)}
            size={isWeb ? 'small' : 'large'}
            color="primary"
            variant="solid"
            onPress={() => {
              saveAltText(altText)
              control.close()
            }}
            style={a.mt_lg}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function SubtitleFileRow({
  language,
  file,
  otherLanguages,
  setCaptions,
  style,
}: {
  language: string
  file: File
  otherLanguages: {code2: string; code3: string; name: string}[]
  setCaptions: (updater: (prev: CaptionsTrack[]) => CaptionsTrack[]) => void
  style: StyleProp<ViewStyle>
}) {
  const {_} = useLingui()
  const t = useTheme()

  const handleValueChange = useCallback(
    (lang: string) => {
      if (lang) {
        setCaptions(subs =>
          subs.map(s => (s.lang === language ? {lang, file: s.file} : s)),
        )
      }
    },
    [setCaptions, language],
  )

  return (
    <View
      style={[
        a.flex_row,
        a.justify_between,
        a.py_md,
        a.px_lg,
        a.rounded_md,
        a.gap_md,
        style,
      ]}>
      <View style={[a.flex_1, a.gap_xs, a.justify_center]}>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          {language === '' ? (
            <WarningIcon
              style={a.flex_shrink_0}
              fill={t.palette.negative_500}
              size="sm"
            />
          ) : (
            <PageTextIcon style={[t.atoms.text, a.flex_shrink_0]} size="sm" />
          )}
          <Text
            style={[a.flex_1, a.leading_snug, a.font_semi_bold, a.mb_2xs]}
            numberOfLines={1}>
            {file.name}
          </Text>
          <select
            value={language}
            onChange={evt => handleValueChange(evt.target.value)}
            style={{maxWidth: 200, flex: 1}}>
            <option value="" disabled selected hidden>
              {/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text */}
              <Trans>Select language...</Trans>
            </option>
            {otherLanguages.map(lang => (
              <option key={langCode(lang)} value={langCode(lang)}>
                {/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text */}
                {`${lang.name} (${langCode(lang)})`}
              </option>
            ))}
          </select>
        </View>
      </View>

      <Button
        label={_(msg`Remove subtitle file`)}
        size="tiny"
        shape="round"
        variant="outline"
        color="secondary"
        onPress={() =>
          setCaptions(subs => subs.filter(s => s.lang !== language))
        }
        style={[a.ml_sm]}>
        <ButtonIcon icon={X} />
      </Button>
    </View>
  )
}

function langCode(lang: {code2: string; code3: string}) {
  return lang.code2 || lang.code3
}
