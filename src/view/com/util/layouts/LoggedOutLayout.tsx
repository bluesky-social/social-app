import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from '../text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useColorSchemeStyle} from 'lib/hooks/useColorSchemeStyle'

export const LoggedOutLayout = ({
  leadin,
  title,
  description,
  children,
}: React.PropsWithChildren<{
  leadin: string
  title: string
  description: string
}>) => {
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const sideBg = useColorSchemeStyle(pal.viewLight, pal.view)
  const contentBg = useColorSchemeStyle(pal.view, {
    backgroundColor: pal.colors.background,
    borderColor: pal.colors.border,
    borderLeftWidth: 1,
  })

  if (isMobile) {
    return <View style={{paddingTop: 10}}>{children}</View>
  }
  return (
    <View style={styles.container}>
      <View style={[styles.side, sideBg]}>
        <Text
          style={[
            pal.textLight,
            styles.leadinText,
            isTabletOrMobile && styles.leadinTextSmall,
          ]}>
          {leadin}
        </Text>
        <Text
          style={[
            pal.link,
            styles.titleText,
            isTabletOrMobile && styles.titleTextSmall,
          ]}>
          {title}
        </Text>
        <Text type="2xl-medium" style={[pal.textLight, styles.descriptionText]}>
          {description}
        </Text>
      </View>
      <View style={[styles.content, contentBg]}>
        <View style={styles.contentWrapper}>{children}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // @ts-ignore web only
    height: '100vh',
  },
  side: {
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

  leadinText: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'right',
  },
  leadinTextSmall: {
    fontSize: 24,
  },
  titleText: {
    fontSize: 58,
    fontWeight: '800',
    textAlign: 'right',
  },
  titleTextSmall: {
    fontSize: 36,
  },
  descriptionText: {
    maxWidth: 400,
    marginTop: 10,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  contentWrapper: {
    maxWidth: 600,
  },
})
