import {type StyleProp, View, type ViewStyle} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {atoms as a, useGutters, useTheme, utils} from '#/alf'
import {Button} from '#/components/Button'
import {ArrowRotateClockwise_Stroke2_Corner0_Rounded as ArrowRotateIcon} from '#/components/icons/ArrowRotate'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function ErrorMessage({
  message,
  numberOfLines,
  style,
  onPressTryAgain,
}: {
  message: string
  numberOfLines?: number
  style?: StyleProp<ViewStyle>
  onPressTryAgain?: () => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const gutter = useGutters(['base'])

  return (
    <Layout.Center>
      <View
        testID="errorMessageView"
        style={[
          a.flex_row,
          a.align_center,
          gutter,
          a.py_sm,
          {backgroundColor: t.palette.pink},
          a.gap_md,
          style,
        ]}>
        <WarningIcon size="md" fill={t.palette.white} />
        <Text
          style={[
            a.flex_1,
            a.font_medium,
            a.leading_snug,
            a.text_md,
            {color: t.palette.white},
          ]}
          numberOfLines={numberOfLines}>
          {message}
        </Text>
        {onPressTryAgain && (
          <Button
            testID="errorMessageTryAgainButton"
            onPress={onPressTryAgain}
            label={l`Retry`}
            accessibilityHint={l`Retries the last action, which errored out`}
            size="small"
            shape="round"
            variant="ghost"
            hoverStyle={{
              backgroundColor: utils.alpha(t.palette.white, 0.2),
            }}>
            <ArrowRotateIcon size="md" fill={t.palette.white} />
          </Button>
        )}
      </View>
    </Layout.Center>
  )
}
