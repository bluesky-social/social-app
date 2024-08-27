import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {BlobRef} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {useEnforceMaxGraphemeCount} from '#/lib/strings/helpers'
import {isNative, isWeb} from '#/platform/detection'
import {useLanguagePrefs} from '#/state/preferences'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import * as Toggle from '#/components/forms/Toggle'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import {Text} from '#/components/Typography'
import {SubtitleFilePicker} from './SubtitleFilePicker'

export function SubtitleDialogBtn({
  addSubtitle,
  ...props
}: {
  alt: string
  subtitles: Map<string, BlobRef>
  setAlt: (alt: string) => void
  addSubtitle: (lang: string, vttBlob: BlobRef) => void
  removeSubtitle: (lang: string) => void
}) {
  const control = Dialog.useDialogControl()
  const agent = useAgent()
  const {_} = useLingui()

  const {mutate: uploadVTT, status} = useMutation({
    mutationFn: async ({lang, file}: {lang: string; file: File}) => {
      const {data} = await agent.uploadBlob(file)
      return {lang, blob: data.blob}
    },
    onSuccess: ({lang, blob}) => {
      addSubtitle(lang, blob)
    },
  })

  return (
    <View style={[a.flex_row, a.mt_xs]}>
      <Button
        label={_(msg`Open video options dialog`)}
        size="xsmall"
        color="secondary"
        variant="ghost"
        onPress={control.open}>
        <ButtonIcon icon={SettingsIcon} />
        <ButtonText>
          {isWeb ? (
            <Trans>Captions & video settings</Trans>
          ) : (
            <Trans>Alt text & video settings</Trans>
          )}
        </ButtonText>
      </Button>
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <SubtitleDialogInner
          {...props}
          uploadVTT={uploadVTT}
          uploadStatus={status}
        />
      </Dialog.Outer>
    </View>
  )
}

function SubtitleDialogInner({
  setAlt,
  uploadVTT,
  uploadStatus,
}: {
  alt: string
  subtitles: Map<string, BlobRef>
  setAlt: (alt: string) => void
  uploadVTT: (args: {lang: string; file: File}) => void
  uploadStatus: 'idle' | 'pending' | 'success' | 'error'
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const enforceLen = useEnforceMaxGraphemeCount()
  const appLanguage = useLanguagePrefs()
  const [lang, _setLang] = useState(appLanguage.primaryLanguage)

  const handleSelectFile = useCallback(
    (file: File) => {
      uploadVTT({lang, file})
    },
    [lang, uploadVTT],
  )

  return (
    <Dialog.ScrollableInner label={_(msg`Video settings`)}>
      <View style={a.gap_md}>
        <Text style={[a.text_xl, a.font_bold, a.leading_tight]}>
          <Trans>Alt text</Trans>
        </Text>
        <TextField.Root>
          <Dialog.Input
            label={_(msg`Alt text`)}
            placeholder={_(msg`Add alt text (optional)`)}
            onChangeText={text => setAlt(enforceLen(text, MAX_ALT_TEXT))}
            maxLength={MAX_ALT_TEXT * 10}
            multiline
            numberOfLines={3}
            autoFocus
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
            <Text style={[a.text_xl, a.font_bold, a.leading_tight]}>
              <Trans>Captions (.vtt)</Trans>
            </Text>
            <View style={[a.flex_row, a.gap_md]}>
              <SubtitleFilePicker
                onSelectFile={handleSelectFile}
                pending={uploadStatus === 'pending'}
              />
            </View>
          </>
        )}

        <View
          style={[
            a.border_t,
            a.w_full,
            t.atoms.border_contrast_medium,
            a.my_md,
          ]}
        />
        <Text style={[a.text_xl, a.font_bold, a.leading_tight]}>
          <Trans>Allow downloads</Trans>
        </Text>
        <Toggle.Item
          type="checkbox"
          label={_(msg`Permit in-app downloads`)}
          value={true}
          onChange={val => val}
          name="permitDownloads"
          style={[a.my_xs, a.justify_between]}>
          <Toggle.LabelText>
            <Trans>Permit in-app downloads</Trans>
          </Toggle.LabelText>
          <Toggle.Platform />
        </Toggle.Item>
        <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>
          <Trans>
            Note: this disables the download option within the app, but it is
            still possible for others to access the raw video file.
          </Trans>
        </Text>

        {isNative && (
          <Button
            label={_(msg`Done`)}
            size="medium"
            color="primary"
            variant="solid"
            onPress={() => control.close()}
            style={a.mt_lg}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
