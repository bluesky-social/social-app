import {createContext, useContext, useMemo} from 'react'
import {View} from 'react-native'

import {atoms as a, ViewStyleProp} from '#/alf'

const Context = createContext({
  gap: 0,
})

export function Row({
  children,
  gap = 0,
  style,
}: ViewStyleProp & {
  children: React.ReactNode
  gap?: number
}) {
  return (
    <Context.Provider value={useMemo(() => ({gap}), [gap])}>
      <View
        style={[
          a.flex_row,
          a.flex_1,
          {
            marginLeft: -gap / 2,
            marginRight: -gap / 2,
          },
          style,
        ]}>
        {children}
      </View>
    </Context.Provider>
  )
}

export function Col({
  children,
  width = 1,
  style,
}: ViewStyleProp & {
  children: React.ReactNode
  width?: number
}) {
  const {gap} = useContext(Context)
  return (
    <View
      style={[
        a.flex_col,
        {
          paddingLeft: gap / 2,
          paddingRight: gap / 2,
          width: `${width * 100}%`,
        },
        style,
      ]}>
      {children}
    </View>
  )
}
