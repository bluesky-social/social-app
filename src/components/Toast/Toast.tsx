import {createContext, useContext, useMemo} from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {getToastTypeStyles, TOAST_TYPE_TO_ICON} from '#/components/Toast/style'
import {type ToastType} from '#/components/Toast/types'
import {Text} from '#/components/Typography'

type ContextType = {
  type: ToastType
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
  const toastTypeStyles = getToastTypeStyles(t)
  const styles = toastTypeStyles[type]
  const Icon = TOAST_TYPE_TO_ICON[type]

  return (
    <Context.Provider value={useMemo(() => ({type}), [type])}>
      <View
        style={[
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
  const t = useTheme()
  const toastTypeStyles = getToastTypeStyles(t)
  const {type} = useContext(Context)
  const styles = toastTypeStyles[type]
  return (
    <Text
      style={[
        a.text_md,
        a.font_bold,
        a.leading_snug,
        {
          color: styles.textColor,
        },
      ]}>
      {children}
    </Text>
  )
}
