import {memo, useCallback} from 'react'
import {View} from 'react-native'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useHaptics} from '#/lib/haptics'
import {useRequireAuth} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CloseQuote_Stroke2_Corner1_Rounded as Quote} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner3_Rounded as Repost} from '#/components/icons/Repost'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {Text} from '#/components/Typography'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'

interface Props {
  isReposted: boolean
  repostCount?: number
  onRepost: () => void
  onQuote: () => void
  big?: boolean
  embeddingDisabled: boolean
}

let RepostButton = ({
  isReposted,
  repostCount,
  onRepost,
  onQuote,
  big,
  embeddingDisabled,
}: Props): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const requireAuth = useRequireAuth()
  const dialogControl = Dialog.useDialogControl()
  const formatPostStatCount = useFormatPostStatCount()

  const onPress = () => requireAuth(() => dialogControl.open())

  const onLongPress = () =>
    requireAuth(() => {
      if (embeddingDisabled) {
        dialogControl.open()
      } else {
        onQuote()
      }
    })

  return (
    <>
      <PostControlButton
        testID="repostBtn"
        active={isReposted}
        activeColor={t.palette.positive_600}
        big={big}
        onPress={onPress}
        onLongPress={onLongPress}
        label={
          isReposted
            ? _(
                msg({
                  message: `Undo repost (${plural(repostCount || 0, {
                    one: '# repost',
                    other: '# reposts',
                  })})`,
                  comment:
                    'Accessibility label for the repost button when the post has been reposted, verb followed by number of reposts and noun',
                }),
              )
            : _(
                msg({
                  message: `Repost (${plural(repostCount || 0, {
                    one: '# repost',
                    other: '# reposts',
                  })})`,
                  comment:
                    'Accessibility label for the repost button when the post has not been reposted, verb form followed by number of reposts and noun form',
                }),
              )
        }>
        <PostControlButtonIcon icon={Repost} />
        {typeof repostCount !== 'undefined' && repostCount > 0 && (
          <PostControlButtonText testID="repostCount">
            {formatPostStatCount(repostCount)}
          </PostControlButtonText>
        )}
      </PostControlButton>
      <Dialog.Outer
        control={dialogControl}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <RepostButtonDialogInner
          isReposted={isReposted}
          onRepost={onRepost}
          onQuote={onQuote}
          embeddingDisabled={embeddingDisabled}
        />
      </Dialog.Outer>
    </>
  )
}
RepostButton = memo(RepostButton)
export {RepostButton}

let RepostButtonDialogInner = ({
  isReposted,
  onRepost,
  onQuote,
  embeddingDisabled,
}: {
  isReposted: boolean
  onRepost: () => void
  onQuote: () => void
  embeddingDisabled: boolean
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const control = Dialog.useDialogContext()

  const onPressRepost = useCallback(() => {
    if (!isReposted) playHaptic()

    control.close(() => {
      onRepost()
    })
  }, [control, isReposted, onRepost, playHaptic])

  const onPressQuote = useCallback(() => {
    playHaptic()
    control.close(() => {
      onQuote()
    })
  }, [control, onQuote, playHaptic])

  const onPressClose = useCallback(() => control.close(), [control])

  return (
    <Dialog.ScrollableInner label={_(msg`Repost or quote post`)}>
      <View style={a.gap_xl}>
        <View style={a.gap_xs}>
          <Button
            style={[a.justify_start, a.px_md, a.gap_sm]}
            label={
              isReposted
                ? _(msg`Remove repost`)
                : _(msg({message: `Repost`, context: 'action'}))
            }
            onPress={onPressRepost}
            size="large"
            variant="ghost"
            color="primary">
            <Repost size="lg" fill={t.palette.primary_500} />
            <Text style={[a.font_semi_bold, a.text_xl]}>
              {isReposted ? (
                <Trans>Remove repost</Trans>
              ) : (
                <Trans context="action">Repost</Trans>
              )}
            </Text>
          </Button>
          <Button
            disabled={embeddingDisabled}
            testID="quoteBtn"
            style={[a.justify_start, a.px_md, a.gap_sm]}
            label={
              embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)
            }
            onPress={onPressQuote}
            size="large"
            variant="ghost"
            color="primary">
            <Quote
              size="lg"
              fill={
                embeddingDisabled
                  ? t.atoms.text_contrast_low.color
                  : t.palette.primary_500
              }
            />
            <Text
              style={[
                a.font_semi_bold,
                a.text_xl,
                embeddingDisabled && t.atoms.text_contrast_low,
              ]}>
              {embeddingDisabled ? (
                <Trans>Quote posts disabled</Trans>
              ) : (
                <Trans>Quote post</Trans>
              )}
            </Text>
          </Button>
        </View>
        <Button
          label={_(msg`Cancel quote post`)}
          onPress={onPressClose}
          size="large"
          variant="outline"
          color="primary">
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
RepostButtonDialogInner = memo(RepostButtonDialogInner)
export {RepostButtonDialogInner}
