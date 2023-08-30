import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'

interface Props {
  testID?: string
  title: React.Component
  horizontal: boolean
  titleStyle?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
}

export function TitleColumnLayout({
  testID,
  title,
  horizontal,
  children,
  titleStyle,
  contentStyle,
}: React.PropsWithChildren<Props>) {
  const pal = usePalette('default')

  const layoutStyles = horizontal ? styles2Column : styles1Column
  return (
    <View testID={testID} style={layoutStyles.container}>
      <View style={[layoutStyles.title, pal.viewLight, titleStyle]}>
        {title}
      </View>
      <View style={[layoutStyles.content, contentStyle]}>{children}</View>
    </View>
  )
}

const styles2Column = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: '100%',
  },
  title: {
    flex: 1,
    paddingHorizontal: 40,
    paddingBottom: 80,
    justifyContent: 'center',
  },
  content: {
    flex: 2,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
})

const styles1Column = StyleSheet.create({
  container: {},
  title: {
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
})
