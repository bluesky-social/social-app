import {memo} from 'react'
import {View} from 'react-native'

import {atoms as a} from '#/alf'
import {type ContentProps, type ScreenProps} from '#/components/Layout'
import {Text} from '#/components/Typography'

export * as Header from '#/components/Layout/Header'

export function TitleText({children}: {children: React.ReactNode}) {
  return <Text style={[a.font_heavy, a.text_3xl]}>{children}</Text>
}

export const Screen = memo(function Screen({style, ...props}: ScreenProps) {
  return <View style={[a.w_full, a.h_full, style]} {...props} />
})

export const Content = memo(function Content({
  style,
  contentContainerStyle,
  children,
}: React.PropsWithChildren<ContentProps>) {
  return (
    <View style={[a.flex_1, style, contentContainerStyle]}>{children}</View>
  )
})
