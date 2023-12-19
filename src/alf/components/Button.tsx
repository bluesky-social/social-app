import React from 'react'
import {Pressable} from 'react-native'

import {useStyles} from '#/alf/system'
import {Text} from '#/alf/components/Typography'

export type ButtonType =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'positive'
  | 'negative'
export type ButtonSize = 'small' | 'large'

export type ButtonProps = React.ComponentProps<typeof Pressable> & {
  type?: ButtonType
  size?: ButtonSize
}

const colorVariants: {
  [key in ButtonType]: Parameters<typeof useStyles>[0]
} = {
  primary: {
    pressable: {
      bg: 'primary',
    },
    pressableHovered: {
      bg: 'primary',
    },
    pressableFocused: {
      bg: 'primary',
    },
    pressablePressed: {
      bg: 'primary',
    },
    text: {
      color: 'white',
    },
  },
  secondary: {
    pressable: {
      bg: 'l2',
    },
    pressableHovered: {
      bg: 'l1',
    },
    pressableFocused: {
      bg: 'l1',
    },
    pressablePressed: {
      bg: 'l1',
    },
    text: {
      color: 'l6',
    },
  },
  tertiary: {},
  positive: {
    pressable: {
      bg: 'green',
    },
    pressableHovered: {
      bg: 'green',
    },
    pressableFocused: {
      bg: 'green',
    },
    pressablePressed: {
      bg: 'green',
    },
    text: {
      color: 'l0',
    },
  },
  negative: {
    pressable: {
      bg: 'red',
    },
    pressableHovered: {
      bg: 'red',
    },
    pressableFocused: {
      bg: 'red',
    },
    pressablePressed: {
      bg: 'red',
    },
    text: {
      color: 'l0',
    },
  },
}

const sizeVariants: {
  [key in ButtonSize]: Parameters<typeof useStyles>[0]
} = {
  small: {
    pressable: {
      py: 'm',
      px: 'l',
      radius: 'm',
    },
    text: {
      fontSize: 'm',
      fontWeight: 'semi',
    },
  },
  large: {
    pressable: {
      py: 'm',
      px: 'l',
      radius: 'm',
    },
    text: {
      fontSize: 'm',
      fontWeight: 'semi',
    },
  },
}

export function Button({
  children,
  type = 'primary',
  size = 'large',
  ...rest
}: React.PropsWithChildren<ButtonProps>) {
  const styles = useStyles(
    React.useMemo<Parameters<typeof useStyles>[0]>(
      () => ({
        pressable: {
          ...colorVariants[type].pressable,
          ...sizeVariants[size].pressable,
        },
        text: {
          textAlign: 'center',
          ...colorVariants[type].text,
          ...sizeVariants[size].text,
        },
        pressableHovered: {
          ...colorVariants[type].pressableHovered,
        },
        pressableFocused: {
          ...colorVariants[type].pressableFocused,
        },
        pressablePressed: {
          ...colorVariants[type].pressablePressed,
        },
      }),
      [type, size],
    ),
  )

  return (
    <Pressable
      {...rest}
      style={state =>
        [
          styles.pressable,
          state.hovered && styles.pressableHovered,
          state.focused && styles.pressableFocused,
          state.pressed && styles.pressablePressed,
        ].filter(Boolean)
      }>
      {typeof children === 'string' ? (
        <Text style={[styles.text]}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
