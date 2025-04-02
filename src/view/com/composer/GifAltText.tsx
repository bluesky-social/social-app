import {useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10, MAX_ALT_TEXT} from '#/lib/constants'
import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {
  EmbedPlayerParams,
  parseEmbedPlayerFromUrl,
} from '#/lib/strings/embed-player'
import {isAndroid} from '#/platform/detection'
import {useResolveGifQuery} from '#/state/queries/resolve-link'
import {Gif} from '#/state/queries/tenor'
import {AltTextCounterWrapper} from '#/view/com/composer/AltTextCounterWrapper'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {DialogControlProps} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Text} from '#/components/Typography'
import {GifEmbed} from '../util/post-embeds/GifEmbed'
import {AltTextReminder} from './photos/Gallery'

export function GifAltTextDialog({
  gif,
  altText,
  onSubmit,
}: {
  gif: Gif
  altText: string
  onSubmit: (alt: string) => void
}) {
  const {data} = useResolveGifQuery(gif)
  const vendorAltText = parseAltFromGIFDescription(data?.description ?? '').alt
  const params = data ? parseEmbedPlayerFromUrl(data.uri) : undefined
  if (!data || !params) {
    return null
  }
  return (
    <GifAltTextDialogLoaded
      altText={altText}
      vendorAltText={vendorAltText}
      thumb={data.thumb?.source.path}
      params={params}
      onSubmit={onSubmit}
    />
  )
}

export function GifAltTextDialogLoaded({
  vendorAltText,
  altText,
  onSubmit,
  params,
  thumb,
}: {
  vendorAltText: string
  altText: string
  onSubmit: (alt: string) => void
  params: EmbedPlayerParams
  thumb: string | undefined
}) {
  const control = Dialog.useDialogControl()
  const {_} = useLingui()
  const t = useTheme()
  const [altTextDraft, setAltTextDraft] = useState(altText || vendorAltText)
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
          {top: 8, left: 8},
          {borderRadius: 6},
          a.pl_xs,
          a.pr_sm,
          a.py_2xs,
          a.flex_row,
          a.gap_xs,
          a.align_center,
          {backgroundColor: 'rgba(0, 0, 0, 0.75)'},
        ]}>
        {altText ? (
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
        onClose={() => {
          onSubmit(altTextDraft)
        }}>
        <Dialog.Handle />
        <AltTextInner
          vendorAltText={vendorAltText}
          altText={altTextDraft}
          onChange={setAltTextDraft}
          thumb={thumb}
          control={control}
          params={params}
        />
      </Dialog.Outer>
    </>
  )
}

function AltTextInner({
  vendorAltText,
  altText,
  onChange,
  control,
  params,
  thumb,
}: {
  vendorAltText: string
  altText: string
  onChange: (text: string) => void
  control: DialogControlProps
  params: EmbedPlayerParams
  thumb: string | undefined
}) {
  const t = useTheme()
  const {_, i18n} = useLingui()

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
                  placeholder={vendorAltText}
                  onChangeText={onChange}
                  defaultValue={altText}
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
                    Alt text will be truncated.{' '}
                    <Plural
                      value={MAX_ALT_TEXT}
                      other={`Limit: ${i18n.number(MAX_ALT_TEXT)} characters.`}
                    />
                  </Trans>
                </Text>
              </View>
            )}
          </View>

          <AltTextCounterWrapper altText={altText}>
            <Button
              label={_(msg`Save`)}
              size="large"
              color="primary"
              variant="solid"
              onPress={() => {
                control.close()
              }}
              style={[a.flex_grow]}>
              <ButtonText>
                <Trans>Save</Trans>
              </ButtonText>
            </Button>
          </AltTextCounterWrapper>
        </View>
        {/* below the text input to force tab order */}
        <View>
          <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
            <Trans>Add alt text</Trans>
          </Text>
          <View style={[a.align_center]}>
            <GifEmbed
              thumb={thumb}
              altText={altText}
              isPreferredAltText={true}
              params={params}
              hideAlt
              style={[{height: 225}]}
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
