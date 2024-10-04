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
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {PortalComponent} from '#/components/Portal'
import {Text} from '#/components/Typography'
import {GifEmbed} from '../util/post-embeds/GifEmbed'
import {AltTextReminder} from './photos/Gallery'

export function GifAltText({
  link: linkProp,
  gif,
  onSubmit,
  Portal,
}: {
  link: ExternalEmbedDraft
  gif?: Gif
  onSubmit: (alt: string) => void
  Portal: PortalComponent
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
        thumb: linkProp.localThumb?.source.path,
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

      <Dialog.Outer control={control} Portal={Portal}>
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
  const t = useTheme()
  const {_, i18n} = useLingui()
  const [altText, setAltText] = useState(initalValue)
  const control = Dialog.useDialogContext()

  const onPressSubmit = useCallback(() => {
    onSubmit(enforceLen(altText, MAX_ALT_TEXT, true))
  }, [onSubmit, altText])

  return (
    <Dialog.ScrollableInner label={_(msg`Add alt text`)}>
      <View style={a.flex_col_reverse}>
        <View style={[a.mt_md, a.gap_md]}>
          <View style={[a.gap_sm]}>
            <View style={[a.relative]}>
              <TextField.LabelText>
                <Trans>Descriptive alt text</Trans>
              </TextField.LabelText>
              <TextField.Root>
                <Dialog.Input
                  label={_(msg`Alt text`)}
                  placeholder={link.title}
                  onChangeText={text => setAltText(text)}
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

              <View
                style={[
                  a.absolute,
                  a.flex_row,
                  a.align_center,
                  a.pr_md,
                  a.pb_sm,
                  {
                    bottom: 0,
                    right: 0,
                  },
                ]}>
                <CharProgress count={altText?.length || 0} max={MAX_ALT_TEXT} />
              </View>
            </View>

            {altText.length > MAX_ALT_TEXT && (
              <View style={[a.pb_sm, a.flex_row, a.gap_xs]}>
                <CircleInfo fill={t.palette.negative_500} />
                <Text
                  style={[
                    a.italic,
                    a.leading_snug,
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>
                    Alt text will be truncated. Limit:{' '}
                    {i18n.number(MAX_ALT_TEXT)} characters.
                  </Trans>
                </Text>
              </View>
            )}
          </View>

          <Button
            label={_(msg`Save`)}
            size="large"
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
          <View style={[a.align_center]}>
            <GifEmbed
              link={link}
              params={params}
              hideAlt
              style={[native({maxHeight: 225})]}
            />
          </View>
        </View>
      </View>
      <Dialog.Close />
      {/* Maybe fix this later -h */}
      {isAndroid ? <View style={{height: 300}} /> : null}
    </Dialog.ScrollableInner>
  )
}
