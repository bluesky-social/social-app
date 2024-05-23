import React from 'react'
import {TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10, MAX_ALT_TEXT} from '#/lib/constants'
import {enforceLen} from '#/lib/strings/helpers'
import {isAndroid} from '#/platform/detection'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Text} from '../../util/text/Text'
import {
  ComposerAction,
  getGifUrl,
  PostExternalEmbed,
  PostGifEmbed,
} from '../state'
import {ExternalEmbed, ExternalEmbedContent} from './ExternalEmbed'
import {AltTextReminder} from './ImageEmbed'

export const GifEmbed = ({
  active,
  postId,
  embed,
  dispatch,
}: {
  active: boolean
  postId: string
  embed: PostGifEmbed
  dispatch: React.Dispatch<ComposerAction>
}): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  const control = Dialog.useDialogControl()

  const gif = embed.gif
  const hasUserAlt = embed.alt !== undefined

  const onSubmitAltText = (next: string) => {
    control.close()

    dispatch({
      type: 'embed_set_gif',
      postId,
      gif: {...embed, alt: next || undefined},
    })
  }

  const externalEmbed = React.useMemo((): PostExternalEmbed => {
    return {
      type: 'external',
      uri: getGifUrl(gif),
      labels: [],
    }
  }, [gif])

  return (
    <View>
      {active && (
        <TouchableOpacity
          testID="altTextButton"
          onPress={control.open}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Add alt text`)}
          accessibilityHint=""
          hitSlop={HITSLOP_10}
          style={[
            a.absolute,
            {top: 20, left: 12, zIndex: 2},
            {borderRadius: 6},
            a.pl_xs,
            a.pr_sm,
            a.py_2xs,
            a.flex_row,
            a.gap_xs,
            a.align_center,
            {backgroundColor: 'rgba(0, 0, 0, 0.75)'},
          ]}>
          {hasUserAlt ? (
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
      )}

      <Dialog.Outer
        control={control}
        nativeOptions={isAndroid ? {sheet: {snapPoints: ['100%']}} : {}}>
        <Dialog.Handle />
        <AltTextInner
          key={embed.gif.id}
          onSubmit={onSubmitAltText}
          embed={embed}
          external={externalEmbed}
          initialValue={embed.alt ?? ''}
        />
      </Dialog.Outer>

      <ExternalEmbed
        active={active}
        postId={postId}
        embed={externalEmbed}
        dispatch={dispatch}
        isGif
      />

      <AltTextReminder />
    </View>
  )
}

function AltTextInner({
  onSubmit,
  embed,
  external,
  initialValue: initalValue,
}: {
  onSubmit: (text: string) => void
  embed: PostGifEmbed
  external: PostExternalEmbed
  initialValue: string
}) {
  const {_} = useLingui()
  const [altText, setAltText] = React.useState(initalValue)
  const control = Dialog.useDialogContext()

  const gif = embed.gif

  const onPressSubmit = React.useCallback(() => {
    onSubmit(altText.trim())
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
                placeholder={gif.title}
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
            <ExternalEmbedContent active embed={external} isGif />
          </View>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
