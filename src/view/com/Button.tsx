import React from 'react'
import {Pressable, Text} from 'react-native'
import {useAlf, tokens} from '#/alf'

export function Button({children, ...rest}: React.PropsWithChildren<any>) {
  const {styles} = useAlf()
  return (
    <Pressable
      {...rest}
      style={[
        styles.flex.row,
        styles.flex.gap.m,
        styles.padding.px.m,
        styles.padding.py.s,
        styles.radius.m,
        styles.backgroundColor.primary,
      ]}>
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.font.s,
            styles.font.semi,
            {color: tokens.color.white},
          ]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
