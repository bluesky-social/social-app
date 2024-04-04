import React, {memo} from 'react'
import {View} from 'react-native'
import {msg, plural} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useRequireAuth} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {CloseQuote_Stroke2_Corner1_Rounded as Quote} from '#/components/icons/Quote'
import {Repost_Stroke2_Corner2_Rounded as Repost} from '#/components/icons/Repost'
import {Text} from '#/components/Typography'

interface Props {
  isReposted: boolean
  repostCount?: number
  onRepost: () => void
  onQuote: () => void
  size?: 'lg' | 'md' | 'sm'
}

let RepostButton = ({
  isReposted,
  repostCount,
  onRepost,
  onQuote,
  size,
}: Props): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const requireAuth = useRequireAuth()
  const dialogControl = Dialog.useDialogControl()

  const color = React.useMemo(
    () => ({
      color: isReposted ? t.palette.positive_600 : t.palette.contrast_500,
    }),
    [t, isReposted],
  )

  return (
    <>
      <Button
        testID="repostBtn"
        onPress={() => {
          requireAuth(() => dialogControl.open())
        }}
        style={[a.flex_row, a.align_center, a.gap_xs, {padding: 5}]}
        label={`${
          isReposted
            ? _(msg`Undo repost`)
            : _(msg({message: 'Repost', context: 'action'}))
        } (${plural(repostCount || 0, {one: '# repost', other: '# reposts'})})`}
        shape="round"
        variant="ghost"
        color="secondary">
        <Repost style={color} size={size} />
        {typeof repostCount !== 'undefined' && repostCount > 0 ? (
          <Text
            testID="repostCount"
            style={[color, a.text_md, isReposted && a.font_bold]}>
            {repostCount}
          </Text>
        ) : undefined}
      </Button>
      <Dialog.Outer control={dialogControl}>
        <Dialog.Handle />
        <Dialog.Inner label={_(msg`Repost or quote post`)}>
          <View style={a.gap_xl}>
            <View style={a.gap_xs}>
              <Button
                style={[a.justify_start, a.px_sm]}
                label={
                  isReposted
                    ? _(msg`Remove repost`)
                    : _(msg({message: `Repost`, context: 'action'}))
                }
                onPress={() => {
                  dialogControl.close()
                  onRepost()
                }}
                size="large"
                variant="outline">
                <ButtonIcon
                  icon={Repost}
                  size="lg"
                  color={t.palette.primary_500}
                />
                <ButtonText style={a.text_xl}>
                  {isReposted
                    ? _(msg`Remove repost`)
                    : _(msg({message: `Repost`, context: 'action'}))}
                </ButtonText>
              </Button>
              <Button
                style={[a.justify_start, a.px_sm]}
                label={_(msg`Quote post`)}
                onPress={() => {
                  dialogControl.close()
                  onQuote()
                }}
                size="large"
                variant="outline">
                <ButtonIcon
                  icon={Quote}
                  size="lg"
                  color={t.palette.primary_500}
                />
                <ButtonText style={a.text_xl}>{_(msg`Quote post`)}</ButtonText>
              </Button>
            </View>
            <Button
              label={_(msg`Cancel quote post`)}
              onAccessibilityEscape={() => dialogControl.close()}
              onPress={() => dialogControl.close()}
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
