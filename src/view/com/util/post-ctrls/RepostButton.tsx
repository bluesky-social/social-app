import React, {memo, useCallback} from 'react'
import {View} from 'react-native'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {POST_CTRL_HITSLOP} from '#/lib/constants'
import {useHaptics} from '#/lib/haptics'
import {useRequireAuth} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CloseQuote_Stroke2_Corner1_Rounded as Quote} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'
import {Text} from '#/components/Typography'
import {formatCount} from '../numeric/format'

interface Props {
  isReposted: boolean
  repostCount?: number
  onRepost: () => void
  onQuote: () => void
  big?: boolean
}

let RepostButton = ({
  isReposted,
  repostCount,
  onRepost,
  onQuote,
  big,
}: Props): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const requireAuth = useRequireAuth()
  const dialogControl = Dialog.useDialogControl()
  const playHaptic = useHaptics()

  const color = React.useMemo(
    () => ({
      color: isReposted ? t.palette.positive_600 : t.palette.contrast_500,
    }),
    [t, isReposted],
  )

  const close = useCallback(() => dialogControl.close(), [dialogControl])

  return (
    <>
      <Button
        testID="repostBtn"
        onPress={() => {
          requireAuth(() => dialogControl.open())
        }}
        style={[
          a.flex_row,
          a.align_center,
          a.gap_xs,
          a.bg_transparent,
          {padding: 5},
        ]}
        hoverStyle={t.atoms.bg_contrast_25}
        label={`${
          isReposted
            ? _(msg`Undo repost`)
            : _(msg({message: 'Repost', context: 'action'}))
        } (${plural(repostCount || 0, {one: '# repost', other: '# reposts'})})`}
        shape="round"
        variant="ghost"
        color="secondary"
        hitSlop={POST_CTRL_HITSLOP}>
        <Repost style={color} width={big ? 22 : 18} />
        {typeof repostCount !== 'undefined' && repostCount > 0 ? (
          <Text
            testID="repostCount"
            style={[
              color,
              big ? a.text_md : {fontSize: 15},
              isReposted && a.font_bold,
            ]}>
            {formatCount(repostCount)}
          </Text>
        ) : undefined}
      </Button>
      <Dialog.Outer control={dialogControl}>
        <Dialog.Handle />
        <Dialog.Inner label={_(msg`Repost or quote post`)}>
          <View style={a.gap_xl}>
            <View style={a.gap_xs}>
              <Button
                style={[a.justify_start, a.px_md]}
                label={
                  isReposted
                    ? _(msg`Remove repost`)
                    : _(msg({message: `Repost`, context: 'action'}))
                }
                onPress={() => {
                  if (!isReposted) playHaptic()

                  dialogControl.close(() => {
                    onRepost()
                  })
                }}
                size="large"
                variant="ghost"
                color="primary">
                <Repost size="lg" fill={t.palette.primary_500} />
                <Text style={[a.font_bold, a.text_xl]}>
                  {isReposted
                    ? _(msg`Remove repost`)
                    : _(msg({message: `Repost`, context: 'action'}))}
                </Text>
              </Button>
              <Button
                testID="quoteBtn"
                style={[a.justify_start, a.px_md]}
                label={_(msg`Quote post`)}
                onPress={() => {
                  playHaptic()
                  dialogControl.close(() => {
                    onQuote()
                  })
                }}
                size="large"
                variant="ghost"
                color="primary">
                <Quote size="lg" fill={t.palette.primary_500} />
                <Text style={[a.font_bold, a.text_xl]}>
                  {_(msg`Quote post`)}
                </Text>
              </Button>
            </View>
            <Button
              label={_(msg`Cancel quote post`)}
              onAccessibilityEscape={close}
              onPress={close}
              size="medium"
              variant="solid"
              color="primary">
              <ButtonText>{_(msg`Cancel`)}</ButtonText>
            </Button>
          </View>
        </Dialog.Inner>
      </Dialog.Outer>
    </>
  )
}
RepostButton = memo(RepostButton)
export {RepostButton}
