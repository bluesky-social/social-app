import {createContext, useContext, useMemo} from 'react'
import {View} from 'react-native'

import {atoms as a, select, useAlf, useTheme} from '#/alf'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {type ToastType} from '#/components/Toast/types'
import {Text} from '#/components/Typography'
import {CircleCheck_Stroke2_Corner0_Rounded as CircleCheck} from '../icons/CircleCheck'

type ContextType = {
  type: ToastType
}

export type ToastComponentProps = {
  type?: ToastType
  content: React.ReactNode
}

export const ICONS = {
  default: CircleCheck,
  success: CircleCheck,
  error: ErrorIcon,
  warning: WarningIcon,
  info: CircleInfo,
}

const Context = createContext<ContextType>({
  type: 'default',
})
Context.displayName = 'ToastContext'

export function Toast({type = 'default', content}: ToastComponentProps) {
  const {fonts} = useAlf()
  const t = useTheme()
  const styles = useToastStyles({type})
  const Icon = ICONS[type]
  /**
   * Vibes-based number, adjusts `top` of `View` that wraps the text to
   * compensate for different type sizes and keep the first line of text
   * aligned with the icon. - esb
   */
  const fontScaleCompensation = useMemo(
    () => parseInt(fonts.scale) * -1 * 0.65,
    [fonts.scale],
  )

  return (
    <Context.Provider value={useMemo(() => ({type}), [type])}>
      <View
        style={[
          a.flex_1,
          a.py_lg,
          a.pl_xl,
          a.pr_2xl,
          a.rounded_md,
          a.border,
          a.flex_row,
          a.gap_sm,
          t.atoms.shadow_sm,
          {
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
          },
        ]}>
        <Icon size="md" fill={styles.iconColor} />

        <View
          style={[
            a.flex_1,
            {
              top: fontScaleCompensation,
            },
          ]}>
          {typeof content === 'string' ? (
            <ToastText>{content}</ToastText>
          ) : (
            content
          )}
        </View>
      </View>
    </Context.Provider>
  )
}

export function ToastText({children}: {children: React.ReactNode}) {
  const {type} = useContext(Context)
  const {textColor} = useToastStyles({type})
  return (
    <Text
      selectable={false}
      style={[
        a.text_md,
        a.font_bold,
        a.leading_snug,
        a.pointer_events_none,
        {
          color: textColor,
        },
      ]}>
      {children}
    </Text>
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
