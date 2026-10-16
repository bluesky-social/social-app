import {useRef, useState} from 'react'
import {TouchableOpacity, View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {HITSLOP_10, MAX_ALT_TEXT} from '#/lib/constants'
import {parseAltFromGIFDescription} from '#/lib/gif-alt-text'
import {
  type EmbedPlayerParams,
  parseEmbedPlayerFromUrl,
} from '#/lib/strings/embed-player'
import {enforceLen} from '#/lib/strings/helpers'
import {useResolveGifQuery} from '#/state/queries/resolve-link'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {GifEmbed} from '#/components/Post/Embed/ExternalEmbed/Gif'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS} from '#/env'
import {type Gif} from '#/features/gifPicker/types'

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
  const {t: l} = useLingui()
  const t = useTheme()
  const initialDraft = altText || vendorAltText
  const [altTextDraft, setAltTextDraft] = useState(initialDraft)
  /*
   * Mirrors `altTextDraft` so `onClose` always sees the latest draft. On web
   * the close callback runs synchronously inside `control.close()`, before a
   * state update made just beforehand (as Cancel does) has committed.
   */
  const draftRef = useRef(initialDraft)
  /*
   * The draft when the sheet was opened, for Cancel to restore. Not
   * `initialDraft`: after the user clears the field and saves, that would
   * bring the vendor description back.
   */
  const openedDraftRef = useRef(initialDraft)

  const setDraft = (text: string) => {
    draftRef.current = text
    setAltTextDraft(text)
  }

  const onOpen = () => {
    openedDraftRef.current = draftRef.current
    control.open()
  }

  return (
    <>
      <TouchableOpacity
        testID="altTextButton"
        accessibilityRole="button"
        accessibilityLabel={l`Add alt text`}
        accessibilityHint=""
        hitSlop={HITSLOP_10}
        onPress={onOpen}
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
          style={[a.font_semi_bold, {color: t.palette.white}]}
          accessible={false}>
          <Trans>ALT</Trans>
        </Text>
      </TouchableOpacity>

      <Admonition type="info" style={[a.mt_sm]}>
        <Trans>
          Alt text describes images for blind and low-vision users, and helps
          give context to everyone.
        </Trans>
      </Admonition>

      <Dialog.Outer
        control={control}
        onClose={() => {
          onSubmit(enforceLen(draftRef.current, MAX_ALT_TEXT, true))
        }}
        nativeOptions={{fullHeight: true}}>
        <AltTextInner
          vendorAltText={vendorAltText}
          altText={altTextDraft}
          onChange={setDraft}
          onCancel={() => {
            setDraft(openedDraftRef.current)
            control.close()
          }}
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
  onCancel,
  control,
  params,
  thumb,
}: {
  vendorAltText: string
  altText: string
  onChange: (text: string) => void
  onCancel: () => void
  control: DialogControlProps
  params: EmbedPlayerParams
  thumb: string | undefined
}) {
  const t = useTheme()
  const {t: l, i18n} = useLingui()

  const cancelButton = () => (
    <Button
      label={l`Cancel`}
      onPress={onCancel}
      size="small"
      color="primary"
      variant="ghost"
      style={[a.rounded_full]}
      testID="gifAltTextCancelBtn">
      <ButtonText style={[a.text_md]}>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )

  const saveButton = () => (
    <Button
      label={l`Save`}
      onPress={() => control.close()}
      size="small"
      color="primary"
      variant="ghost"
      style={[a.rounded_full]}
      testID="gifAltTextSaveBtn">
      <ButtonText style={[a.text_md]}>
        <Trans>Save</Trans>
      </ButtonText>
    </Button>
  )

  return (
    <Dialog.ScrollableInner
      label={l`Add alt text`}
      style={[a.overflow_hidden]}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
          <Dialog.HeaderText>
            <Trans>Add alt text</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.pt_lg, a.gap_md, IS_LIQUID_GLASS ? a.px_2xl : a.px_xl]}>
        {/*
         * The field comes first so it is always fully visible above the
         * keyboard. The GIF sits below it and scrolls into view as needed.
         */}
        <View style={[a.gap_sm]}>
          <View>
            <View style={[a.flex_row, a.justify_between, a.align_center]}>
              <TextField.LabelText>
                <Trans>Descriptive alt text</Trans>
              </TextField.LabelText>
              <CharProgress
                /*
                 * The inner count Text uses flexGrow, which Yoga sizes to
                 * nothing inside an auto-width container. The composer footer
                 * gives it a fixed width for the same reason.
                 */
                style={[a.mb_sm, {minWidth: 65}]}
                textStyle={[a.text_sm, t.atoms.text_contrast_medium]}
                size={20}
                count={altText.length}
                max={MAX_ALT_TEXT}
              />
            </View>
            <TextField.Root>
              <Dialog.Input
                label={l`Alt text`}
                placeholder={vendorAltText}
                onChangeText={onChange}
                value={altText}
                style={{minHeight: 120}}
                multiline
                autoFocus
                scrollEnabled={false}
                onKeyPress={({nativeEvent}) => {
                  if (nativeEvent.key === 'Escape') {
                    control.close()
                  }
                }}
              />
            </TextField.Root>
          </View>

          {altText.length > MAX_ALT_TEXT && (
            <View style={[a.flex_row, a.gap_xs]}>
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

        <GifEmbed
          thumb={thumb}
          altText={altText}
          isPreferredAltText={true}
          params={params}
          hideAlt
          minMobileAspectRatio={1}
        />
      </View>
    </Dialog.ScrollableInner>
  )
}
