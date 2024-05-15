import React, {useCallback, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {AppBskyEmbedExternal} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ExternalEmbedDraft} from '#/lib/api'
import {HITSLOP_10, MAX_ALT_TEXT} from '#/lib/constants'
import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {
  EmbedPlayerParams,
  parseEmbedPlayerFromUrl,
} from '#/lib/strings/embed-player'
import {enforceLen} from '#/lib/strings/helpers'
import {isAndroid} from '#/platform/detection'
import {Gif} from '#/state/queries/tenor'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Text} from '#/components/Typography'
import {GifEmbed} from '../util/post-embeds/GifEmbed'
import {AltTextReminder} from './photos/Gallery'

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

  const onPressSubmit = useCallback(
    (alt: string) => {
      control.close(() => {
        onSubmit(alt)
      })
    },
    [onSubmit, control],
  )

  if (!gif || !params) return null

  const parsedAlt = parseAltFromGIFDescription(link.description)
  return (
    <>
      <TouchableOpacity
        testID="altTextButton"
        accessibilityRole="button"
        accessibilityLabel={_(msg`Add alt text`)}
        accessibilityHint=""
        hitSlop={HITSLOP_10}
        onPress={control.open}
        style={[
          a.absolute,
          {top: 20, left: 12},
          {borderRadius: 6},
          a.pl_xs,
          a.pr_sm,
          a.py_2xs,
          a.flex_row,
          a.gap_xs,
          a.align_center,
          {backgroundColor: 'rgba(0, 0, 0, 0.75)'},
        ]}>
        {parsedAlt.isPreferred ? (
          <Check size="xs" fill={t.palette.white} style={a.ml_xs} />
        ) : (
          <Plus size="sm" fill={t.palette.white} />
        )}
        <Text
          style={[a.font_bold, {color: t.palette.white}]}
          accessible={false}>
          <Trans>ALT</Trans>
        </Text>
      </TouchableOpacity>

      <AltTextReminder />

      <Dialog.Outer
        control={control}
        nativeOptions={isAndroid ? {sheet: {snapPoints: ['100%']}} : {}}>
        <Dialog.Handle />
        <AltTextInner
          onSubmit={onPressSubmit}
          link={link}
          params={params}
          initialValue={parsedAlt.isPreferred ? parsedAlt.alt : ''}
          key={link.uri}
        />
      </Dialog.Outer>
    </>
  )
}

function AltTextInner({
  onSubmit,
  link,
  params,
  initialValue: initalValue,
}: {
  onSubmit: (text: string) => void
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
  initialValue: string
}) {
  const {_} = useLingui()
  const [altText, setAltText] = useState(initalValue)
  const control = Dialog.useDialogContext()

  const onPressSubmit = useCallback(() => {
    onSubmit(altText)
  }, [onSubmit, altText])

  return (
    <Dialog.ScrollableInner label={_(msg`Add alt text`)}>
      <View style={a.flex_col_reverse}>
        <View style={[a.mt_md, a.gap_md]}>
          <View>
            <TextField.LabelText>
              <Trans>Descriptive alt text</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <Dialog.Input
                label={_(msg`Alt text`)}
                placeholder={link.title}
                onChangeText={text =>
                  setAltText(enforceLen(text, MAX_ALT_TEXT))
                }
                value={altText}
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
        {/* below the text input to force tab order */}
        <View>
          <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
            <Trans>Add alt text</Trans>
          </Text>
          <View style={[a.w_full, a.align_center, native({maxHeight: 200})]}>
            <GifEmbed link={link} params={params} hideAlt />
          </View>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
