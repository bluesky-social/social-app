import {createContext, useContext} from 'react'
import {View, type ViewStyle} from 'react-native'

import {atoms as a, tokens, useTheme} from '#/alf'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {Text} from '#/components/Typography'

const PanelContext = createContext<{active: boolean}>({active: false})

/**
 * A nice container for Toggles. See the Threadgate dialog for an example.
 */
export function Panel({
  children,
  active = false,
  adjacent,
}: {
  children: React.ReactNode
  active?: boolean
  adjacent?: 'leading' | 'trailing' | 'both'
}) {
  const t = useTheme()

  const leading = adjacent === 'leading' || adjacent === 'both'
  const trailing = adjacent === 'trailing' || adjacent === 'both'
  const rounding = {
    borderTopLeftRadius: leading
      ? tokens.borderRadius.xs
      : tokens.borderRadius.md,
    borderTopRightRadius: leading
      ? tokens.borderRadius.xs
      : tokens.borderRadius.md,
    borderBottomLeftRadius: trailing
      ? tokens.borderRadius.xs
      : tokens.borderRadius.md,
    borderBottomRightRadius: trailing
      ? tokens.borderRadius.xs
      : tokens.borderRadius.md,
  } satisfies ViewStyle

  return (
    <View
      style={[
        a.w_full,
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.px_md,
        a.py_md,
        {minHeight: tokens.space._2xl + tokens.space.md * 2},
        rounding,
        active
          ? {backgroundColor: t.palette.primary_50}
          : t.atoms.bg_contrast_50,
      ]}>
      <PanelContext value={{active}}>{children}</PanelContext>
    </View>
  )
}

export function PanelText({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ComponentType<SVGIconProps>
}) {
  const t = useTheme()
  const ctx = useContext(PanelContext)

  const text = (
    <Text
      style={[
        a.text_md,
        a.flex_1,
        ctx.active
          ? [a.font_medium, t.atoms.text]
          : [t.atoms.text_contrast_medium],
      ]}>
      {children}
    </Text>
  )

  if (icon) {
    // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
    return (
      <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_1]}>
        <PanelIcon icon={icon} />
        {text}
      </View>
    )
  }

  return text
}

export function PanelIcon({
  icon: Icon,
}: {
  icon: React.ComponentType<SVGIconProps>
}) {
  const t = useTheme()
  const ctx = useContext(PanelContext)
  return (
    <Icon
      style={[
        ctx.active ? t.atoms.text : t.atoms.text_contrast_medium,
        a.flex_shrink_0,
      ]}
      size="md"
    />
  )
}

/**
 * A group of panels. TODO: auto-leading/trailing
 */
export function PanelGroup({children}: {children: React.ReactNode}) {
  return <View style={[a.w_full, a.gap_2xs]}>{children}</View>
}
