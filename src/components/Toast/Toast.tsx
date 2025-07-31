import {createContext, useContext, useMemo} from 'react'
import {View} from 'react-native'

import {atoms as a, select, useTheme} from '#/alf'
import {Check_Stroke2_Corner0_Rounded as SuccessIcon} from '#/components/icons/Check'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {CircleInfo_Stroke2_Corner0_Rounded as ErrorIcon} from '#/components/icons/CircleInfo'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import {type ToastType} from '#/components/Toast/types'
import {Text} from '#/components/Typography'

type ContextType = {
  type: ToastType
}

export const ICONS = {
  default: SuccessIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: CircleInfo,
}

const Context = createContext<ContextType>({
  type: 'default',
})

export function Toast({
  type,
  content,
}: {
  type: ToastType
  content: React.ReactNode
}) {
  const t = useTheme()
  const styles = useToastStyles({type})
  const Icon = ICONS[type]

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

        <View style={[a.flex_1]}>
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
      style={[
        a.text_md,
        a.font_bold,
        a.leading_snug,
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
        backgroundColor: select(t.name, {
          light: t.atoms.bg_contrast_25.backgroundColor,
          dim: t.atoms.bg_contrast_100.backgroundColor,
          dark: t.atoms.bg_contrast_100.backgroundColor,
        }),
        borderColor: select(t.name, {
          light: t.atoms.border_contrast_low.borderColor,
          dim: t.atoms.border_contrast_high.borderColor,
          dark: t.atoms.border_contrast_high.borderColor,
        }),
        iconColor: select(t.name, {
          light: t.atoms.text_contrast_medium.color,
          dim: t.atoms.text_contrast_medium.color,
          dark: t.atoms.text_contrast_medium.color,
        }),
        textColor: select(t.name, {
          light: t.atoms.text_contrast_medium.color,
          dim: t.atoms.text_contrast_medium.color,
          dark: t.atoms.text_contrast_medium.color,
        }),
      },
      success: {
        backgroundColor: select(t.name, {
          light: t.palette.primary_100,
          dim: t.palette.primary_100,
          dark: t.palette.primary_50,
        }),
        borderColor: select(t.name, {
          light: t.palette.primary_500,
          dim: t.palette.primary_500,
          dark: t.palette.primary_500,
        }),
        iconColor: select(t.name, {
          light: t.palette.primary_500,
          dim: t.palette.primary_600,
          dark: t.palette.primary_600,
        }),
        textColor: select(t.name, {
          light: t.palette.primary_500,
          dim: t.palette.primary_600,
          dark: t.palette.primary_600,
        }),
      },
      error: {
        backgroundColor: select(t.name, {
          light: t.palette.negative_200,
          dim: t.palette.negative_25,
          dark: t.palette.negative_25,
        }),
        borderColor: select(t.name, {
          light: t.palette.negative_300,
          dim: t.palette.negative_300,
          dark: t.palette.negative_300,
        }),
        iconColor: select(t.name, {
          light: t.palette.negative_600,
          dim: t.palette.negative_600,
          dark: t.palette.negative_600,
        }),
        textColor: select(t.name, {
          light: t.palette.negative_600,
          dim: t.palette.negative_600,
          dark: t.palette.negative_600,
        }),
      },
      warning: {
        backgroundColor: select(t.name, {
          light: t.atoms.bg_contrast_25.backgroundColor,
          dim: t.atoms.bg_contrast_100.backgroundColor,
          dark: t.atoms.bg_contrast_100.backgroundColor,
        }),
        borderColor: select(t.name, {
          light: t.atoms.border_contrast_low.borderColor,
          dim: t.atoms.border_contrast_high.borderColor,
          dark: t.atoms.border_contrast_high.borderColor,
        }),
        iconColor: select(t.name, {
          light: t.atoms.text_contrast_medium.color,
          dim: t.atoms.text_contrast_medium.color,
          dark: t.atoms.text_contrast_medium.color,
        }),
        textColor: select(t.name, {
          light: t.atoms.text_contrast_medium.color,
          dim: t.atoms.text_contrast_medium.color,
          dark: t.atoms.text_contrast_medium.color,
        }),
      },
      info: {
        backgroundColor: select(t.name, {
          light: t.atoms.bg_contrast_25.backgroundColor,
          dim: t.atoms.bg_contrast_100.backgroundColor,
          dark: t.atoms.bg_contrast_100.backgroundColor,
        }),
        borderColor: select(t.name, {
          light: t.atoms.border_contrast_low.borderColor,
          dim: t.atoms.border_contrast_high.borderColor,
          dark: t.atoms.border_contrast_high.borderColor,
        }),
        iconColor: select(t.name, {
          light: t.atoms.text_contrast_medium.color,
          dim: t.atoms.text_contrast_medium.color,
          dark: t.atoms.text_contrast_medium.color,
        }),
        textColor: select(t.name, {
          light: t.atoms.text_contrast_medium.color,
          dim: t.atoms.text_contrast_medium.color,
          dark: t.atoms.text_contrast_medium.color,
        }),
      },
    }[type]
  }, [t, type])
}
