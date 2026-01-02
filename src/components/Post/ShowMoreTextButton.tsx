import {useCallback, useMemo} from 'react'
import {LayoutAnimation, type TextStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {HITSLOP_10} from '#/lib/constants'
import {atoms as a, flatten, type TextStyleProp, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'

export function ShowMoreTextButton({
  onPress: onPressProp,
  style,
}: TextStyleProp & {onPress: () => void}) {
  const t = useTheme()
  const {_} = useLingui()

  const onPress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    onPressProp()
  }, [onPressProp])

  const textStyle = useMemo(() => {
    return flatten([a.leading_snug, a.text_sm, style]) as TextStyle & {
      fontSize: number
      lineHeight: number
    }
  }, [style])

  return (
    <Button
      label={_(msg`Expand post text`)}
      onPress={onPress}
      style={[
        a.self_start,
        {
          paddingBottom: textStyle.fontSize / 3,
        },
      ]}
      hitSlop={HITSLOP_10}>
      {({pressed, hovered}) => (
        <Text
          style={[
            textStyle,
            {
              color: t.palette.primary_500,
              opacity: pressed ? 0.6 : 1,
              textDecorationLine: hovered ? 'underline' : undefined,
            },
          ]}>
          <Trans>Show More</Trans>
        </Text>
      )}
    </Button>
  )
}
