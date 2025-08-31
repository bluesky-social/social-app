import {createContext, useContext, useMemo} from 'react'
import {type GestureResponderEvent, View} from 'react-native'

import {atoms as a, select, useAlf, useTheme} from '#/alf'
import {
  Button,
  type ButtonProps,
  type UninheritableButtonProps,
} from '#/components/Button'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '#/components/icons/CircleCheck'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {dismiss} from '#/components/Toast/sonner'
import {type ToastType} from '#/components/Toast/types'
import {Text as BaseText} from '#/components/Typography'

export const ICONS = {
  default: CircleCheck,
  success: CircleCheck,
  error: ErrorIcon,
  warning: WarningIcon,
  info: CircleInfo,
}

const ToastConfigContext = createContext<{
  id: string
  type: ToastType
}>({
  id: '',
  type: 'default',
})
ToastConfigContext.displayName = 'ToastConfigContext'

export function ToastConfigProvider({
  children,
  id,
  type,
}: {
  children: React.ReactNode
  id: string
  type: ToastType
}) {
  return (
    <ToastConfigContext.Provider
      value={useMemo(() => ({id, type}), [id, type])}>
      {children}
    </ToastConfigContext.Provider>
  )
}

export function Outer({children}: {children: React.ReactNode}) {
  const t = useTheme()
  const {type} = useContext(ToastConfigContext)
  const styles = useToastStyles({type})

  return (
    <View
      style={[
        a.flex_1,
        a.p_lg,
        a.rounded_md,
        a.border,
        a.flex_row,
        a.gap_sm,
        t.atoms.shadow_sm,
        {
          paddingVertical: 14, // 16 seems too big
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
        },
      ]}>
      {children}
    </View>
  )
}

export function Icon({icon}: {icon?: React.ComponentType<SVGIconProps>}) {
  const {type} = useContext(ToastConfigContext)
  const styles = useToastStyles({type})
  const IconComponent = icon || ICONS[type]
  return <IconComponent size="md" fill={styles.iconColor} />
}

export function Text({children}: {children: React.ReactNode}) {
  const {type} = useContext(ToastConfigContext)
  const {textColor} = useToastStyles({type})
  const {fontScaleCompensation} = useToastFontScaleCompensation()
  return (
    <View
      style={[
        a.flex_1,
        a.pr_lg,
        {
          top: fontScaleCompensation,
        },
      ]}>
      <BaseText
        selectable={false}
        style={[
          a.text_md,
          a.font_medium,
          a.leading_snug,
          a.pointer_events_none,
          {
            color: textColor,
          },
        ]}>
        {children}
      </BaseText>
    </View>
  )
}

export function Action(
  props: Omit<ButtonProps, UninheritableButtonProps | 'children'> & {
    children: React.ReactNode
  },
) {
  const t = useTheme()
  const {fontScaleCompensation} = useToastFontScaleCompensation()
  const {type} = useContext(ToastConfigContext)
  const {id} = useContext(ToastConfigContext)
  const styles = useMemo(() => {
    const base = {
      base: {
        textColor: t.palette.contrast_600,
        backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
      },
      interacted: {
        textColor: t.atoms.text.color,
        backgroundColor: t.atoms.bg_contrast_50.backgroundColor,
      },
    }
    return {
      default: base,
      success: {
        base: {
          textColor: select(t.name, {
            light: t.palette.primary_800,
            dim: t.palette.primary_900,
            dark: t.palette.primary_900,
          }),
          backgroundColor: t.palette.primary_25,
        },
        interacted: {
          textColor: select(t.name, {
            light: t.palette.primary_900,
            dim: t.palette.primary_975,
            dark: t.palette.primary_975,
          }),
          backgroundColor: t.palette.primary_50,
        },
      },
      error: {
        base: {
          textColor: select(t.name, {
            light: t.palette.negative_700,
            dim: t.palette.negative_900,
            dark: t.palette.negative_900,
          }),
          backgroundColor: t.palette.negative_25,
        },
        interacted: {
          textColor: select(t.name, {
            light: t.palette.negative_900,
            dim: t.palette.negative_975,
            dark: t.palette.negative_975,
          }),
          backgroundColor: t.palette.negative_50,
        },
      },
      warning: base,
      info: base,
    }[type]
  }, [t, type])

  const onPress = (e: GestureResponderEvent) => {
    console.log('Toast Action pressed, dismissing toast', id)
    dismiss(id)
    props.onPress?.(e)
  }

  return (
    <View style={{top: fontScaleCompensation}}>
      <Button {...props} onPress={onPress}>
        {s => {
          const interacted = s.pressed || s.hovered || s.focused
          return (
            <>
              <View
                style={[
                  a.absolute,
                  a.curve_continuous,
                  {
                    // tiny button styles
                    top: -5,
                    bottom: -5,
                    left: -9,
                    right: -9,
                    borderRadius: 6,
                    backgroundColor: interacted
                      ? styles.interacted.backgroundColor
                      : styles.base.backgroundColor,
                  },
                ]}
              />
              <BaseText
                style={[
                  a.text_md,
                  a.font_medium,
                  a.leading_snug,
                  {
                    color: interacted
                      ? styles.interacted.textColor
                      : styles.base.textColor,
                  },
                ]}>
                {props.children}
              </BaseText>
            </>
          )
        }}
      </Button>
    </View>
  )
}

/**
 * Vibes-based number, provides t `top` value to wrap the text to compensate
 * for different type sizes and keep the first line of text aligned with the
 * icon. - esb
 */
function useToastFontScaleCompensation() {
  const {fonts} = useAlf()
  const fontScaleCompensation = useMemo(
    () => parseInt(fonts.scale) * -1 * 0.65,
    [fonts.scale],
  )
  return useMemo(
    () => ({
      fontScaleCompensation,
    }),
    [fontScaleCompensation],
  )
}

function useToastStyles({type}: {type: ToastType}) {
  const t = useTheme()
  return useMemo(() => {
    return {
      default: {
        backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
        borderColor: t.atoms.border_contrast_low.borderColor,
        iconColor: t.atoms.text.color,
        textColor: t.atoms.text.color,
      },
      success: {
        backgroundColor: t.palette.primary_25,
        borderColor: select(t.name, {
          light: t.palette.primary_300,
          dim: t.palette.primary_200,
          dark: t.palette.primary_100,
        }),
        iconColor: select(t.name, {
          light: t.palette.primary_600,
          dim: t.palette.primary_700,
          dark: t.palette.primary_700,
        }),
        textColor: select(t.name, {
          light: t.palette.primary_600,
          dim: t.palette.primary_700,
          dark: t.palette.primary_700,
        }),
      },
      error: {
        backgroundColor: t.palette.negative_25,
        borderColor: select(t.name, {
          light: t.palette.negative_200,
          dim: t.palette.negative_200,
          dark: t.palette.negative_100,
        }),
        iconColor: select(t.name, {
          light: t.palette.negative_700,
          dim: t.palette.negative_900,
          dark: t.palette.negative_900,
        }),
        textColor: select(t.name, {
          light: t.palette.negative_700,
          dim: t.palette.negative_900,
          dark: t.palette.negative_900,
        }),
      },
      warning: {
        backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
        borderColor: t.atoms.border_contrast_low.borderColor,
        iconColor: t.atoms.text.color,
        textColor: t.atoms.text.color,
      },
      info: {
        backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
        borderColor: t.atoms.border_contrast_low.borderColor,
        iconColor: t.atoms.text.color,
        textColor: t.atoms.text.color,
      },
    }[type]
  }, [t, type])
}
