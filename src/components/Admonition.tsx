import {createContext, useContext, useMemo} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'

import {atoms as a, useAlf, useBreakpoints, useTheme} from '#/alf'
import {Button as BaseButton, type ButtonProps} from '#/components/Button'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
import {CircleX_Stroke2_Corner0_Rounded as CircleXIcon} from '#/components/icons/CircleX'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {Text as BaseText, type TextProps} from '#/components/Typography'

export const colors = {
  warning: '#FFC404',
}

type Context = {
  type: 'info' | 'tip' | 'warning' | 'error'
}

const Context = createContext<Context>({
  type: 'info',
})
Context.displayName = 'AdmonitionContext'

export function Icon() {
  const t = useTheme()
  const {type} = useContext(Context)
  const Icon = {
    info: CircleInfoIcon,
    tip: CircleInfoIcon,
    warning: WarningIcon,
    error: CircleXIcon,
  }[type]
  const fill = {
    info: t.atoms.text_contrast_medium.color,
    tip: t.palette.primary_500,
    warning: colors.warning,
    error: t.palette.negative_500,
  }[type]
  return <Icon fill={fill} size="md" />
}

export function Text({
  children,
  style,
  ...rest
}: Pick<TextProps, 'children' | 'style'>) {
  const {fontScaleCompensation} = useAdmonitionFontScaleCompensation()

  return (
    <View
      style={[
        a.flex_1,
        {
          top: fontScaleCompensation,
        },
      ]}>
      <BaseText
        {...rest}
        style={[a.flex_1, a.text_sm, a.leading_snug, a.pr_md, style]}>
        {children}
      </BaseText>
    </View>
  )
}

export function Button({
  children,
  ...props
}: Omit<ButtonProps, 'size' | 'variant' | 'color'>) {
  return (
    <BaseButton size="tiny" variant="outline" color="secondary" {...props}>
      {children}
    </BaseButton>
  )
}

export function Row({children}: {children: React.ReactNode}) {
  return <View style={[a.flex_1, a.flex_row, a.gap_sm]}>{children}</View>
}

export function Outer({
  children,
  type = 'info',
  style,
}: {
  children: React.ReactNode
  type?: Context['type']
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const borderColor = {
    info: t.atoms.border_contrast_high.borderColor,
    tip: t.palette.primary_500,
    warning: colors.warning,
    error: t.palette.negative_500,
  }[type]
  return (
    <Context.Provider value={{type}}>
      <View
        style={[
          gtMobile ? a.p_md : a.p_sm,
          a.rounded_sm,
          a.border,
          t.atoms.bg,
          {borderColor},
          style,
        ]}>
        {children}
      </View>
    </Context.Provider>
  )
}

export function Admonition({
  children,
  type,
  style,
}: {
  children: TextProps['children']
  type?: Context['type']
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Outer type={type} style={style}>
      <Row>
        <Icon />
        <Text>{children}</Text>
      </Row>
    </Outer>
  )
}

// This is very vibe based, but it seems to work well enough across all 3 font scales.
function useAdmonitionFontScaleCompensation() {
  const {fonts} = useAlf()
  const fontScaleCompensation = useMemo(() => {
    const scale = parseInt(fonts.scale, 10)
    return 1.0 - 0.57 * scale
  }, [fonts.scale])

  return useMemo(
    () => ({
      fontScaleCompensation,
    }),
    [fontScaleCompensation],
  )
}
