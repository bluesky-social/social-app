import React, {useCallback, useState} from 'react'
import {Keyboard, TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ExternalEmbedDraft} from '#/lib/api'
import {HITSLOP_10} from '#/lib/constants'
import {parseEmbedPlayerFromUrl} from '#/lib/strings/embed-player'
import {Gif} from '#/state/queries/tenor'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Text} from '#/components/Typography'
import {GifEmbed} from '../util/post-embeds/GifEmbed'

export function GifAltText({
  link: linkProp,
  gif,
  onSubmit,
}: {
  link: ExternalEmbedDraft
  gif?: Gif
  onSubmit: (alt: string) => void
}) {
  const control = Dialog.useDialogControl()
  const {_} = useLingui()
  const t = useTheme()
  const [altText, setAltText] = useState('')

  const {link, params} = React.useMemo(() => {
    return {
      link: {
        title: linkProp.meta?.title ?? linkProp.uri,
        uri: linkProp.uri,
        description: linkProp.meta?.description ?? '',
        thumb: linkProp.localThumb?.path,
      },
      params: parseEmbedPlayerFromUrl(linkProp.uri),
    }
  }, [linkProp])

  const onPressSubmit = useCallback(() => {
    control.close(() => {
      onSubmit(altText)
    })
  }, [onSubmit, altText, control])

  if (!gif || !params) return null

  return (
    <>
      <TouchableOpacity
        testID="altTextButton"
        accessibilityRole="button"
        accessibilityLabel={_(msg`Add alt text`)}
        accessibilityHint=""
        hitSlop={HITSLOP_10}
        onPress={() => {
          Keyboard.dismiss()
          setAltText(link.description.replace('ALT: ', ''))
          control.open()
        }}
        style={[
          a.absolute,
          {top: 20, left: 12},
          a.rounded_xs,
          a.pl_xs,
          a.pr_sm,
          a.py_2xs,
          a.flex_row,
          a.gap_xs,
          {backgroundColor: 'rgba(0, 0, 0, 0.75)'},
        ]}>
        {link.description ? (
          <Check size="sm" fill={t.palette.white} />
        ) : (
          <Plus size="sm" fill={t.palette.white} />
        )}
        <Text
          style={[a.font_bold, {color: t.palette.white}]}
          accessible={false}>
          <Trans>ALT</Trans>
        </Text>
      </TouchableOpacity>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner label={_(msg`Add alt text`)}>
          <Dialog.Close />
          <Text
            style={[
              a.text_2xl,
              a.font_bold,
              a.leading_tight,
              a.pb_sm,
              web(a.pt_lg),
            ]}>
            <Trans>Add ALT text</Trans>
          </Text>
          <GifEmbed link={link} params={params} />
          <View style={[a.mt_md, a.gap_md]}>
            <View>
              <TextField.LabelText>
                <Trans>Descriptive alt text</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <Dialog.Input
                  label={_(msg`Alt text`)}
                  placeholder={link.title}
                  value={altText}
                  onChangeText={setAltText}
                  onSubmitEditing={onPressSubmit}
                  returnKeyType="done"
                />
              </TextField.Root>
            </View>
            <Button
              label={_(msg`Save`)}
              size="medium"
              color="primary"
              variant="solid"
              onPress={onPressSubmit}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
