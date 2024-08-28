import React, {useCallback, useState} from 'react'
import {View} from 'react-native'
import {BlobRef} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {useEnforceMaxGraphemeCount} from '#/lib/strings/helpers'
import {isWeb} from '#/platform/detection'
import {useLanguagePrefs} from '#/state/preferences'
import {useAgent} from '#/state/session'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CC_Stroke2_Corner0_Rounded as CCIcon} from '#/components/icons/CC'
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
        label={_(msg`Open video captions dialog`)}
        size="xsmall"
        color="secondary"
        variant="ghost"
        onPress={control.open}>
        <ButtonIcon icon={CCIcon} />
        <ButtonText>
          {isWeb ? <Trans>Captions & alt text</Trans> : <Trans>Alt text</Trans>}
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
  alt,
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
            value={alt}
            onChange={evt =>
              setAlt(enforceLen(evt.nativeEvent.text, MAX_ALT_TEXT))
            }
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

        <View style={web([a.flex_row, a.justify_end])}>
          <Button
            label={_(msg`Done`)}
            size={isWeb ? 'small' : 'medium'}
            color="primary"
            variant="solid"
            onPress={() => control.close()}
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
