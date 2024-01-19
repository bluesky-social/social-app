import React from 'react'
import {View} from 'react-native'

import {atoms, useTheme} from '#/alf'

/**
 * NOT FINISHED, just here as a reference
 */
export function InputGroup(props: React.PropsWithChildren<{}>) {
  const t = useTheme()
  const children = React.Children.toArray(props.children)
  const total = children.length
  return (
    <View style={[atoms.w_full]}>
      {children.map((child, i) => {
        return React.isValidElement(child) ? (
          <React.Fragment key={i}>
            {i > 0 ? (
              <View
                style={[atoms.border_b, {borderColor: t.palette.contrast_500}]}
              />
            ) : null}
            {React.cloneElement(child, {
              // @ts-ignore
              style: [
                ...(Array.isArray(child.props?.style)
                  ? child.props.style
                  : [child.props.style || {}]),
                {
                  borderTopLeftRadius: i > 0 ? 0 : undefined,
                  borderTopRightRadius: i > 0 ? 0 : undefined,
                  borderBottomLeftRadius: i < total - 1 ? 0 : undefined,
                  borderBottomRightRadius: i < total - 1 ? 0 : undefined,
                  borderBottomWidth: i < total - 1 ? 0 : undefined,
                },
              ],
            })}
          </React.Fragment>
        ) : null
      })}
    </View>
  )
}
