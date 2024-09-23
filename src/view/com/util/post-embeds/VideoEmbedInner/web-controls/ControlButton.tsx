import React from 'react'
import {SvgProps} from 'react-native-svg'

import {atoms as a, useTheme} from '#/alf'
import {Button} from '#/components/Button'

export function ControlButton({
  active,
  activeLabel,
  inactiveLabel,
  activeIcon: ActiveIcon,
  inactiveIcon: InactiveIcon,
  onPress,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  activeIcon: React.ComponentType<Pick<SvgProps, 'fill' | 'width'>>
  inactiveIcon: React.ComponentType<Pick<SvgProps, 'fill' | 'width'>>
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <Button
      label={active ? activeLabel : inactiveLabel}
      onPress={onPress}
      variant="ghost"
      shape="round"
      size="large"
      style={a.p_2xs}
      hoverStyle={{backgroundColor: 'rgba(255, 255, 255, 0.1)'}}>
      {active ? (
        <ActiveIcon fill={t.palette.white} width={20} />
      ) : (
        <InactiveIcon fill={t.palette.white} width={20} />
      )}
    </Button>
  )
}
