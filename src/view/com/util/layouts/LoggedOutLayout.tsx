import {ScrollView, StyleSheet, View} from 'react-native'
import type React from 'react'

import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a} from '#/alf'
import {IS_WEB} from '#/env'
import {Text} from '../text/Text'

export const LoggedOutLayout = ({
  leadin,
  title,
  description,
  children,
  scrollable,
}: React.PropsWithChildren<{
  leadin: string
  title: string
  description: string
  scrollable?: boolean
}>) => {
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
  const pal = usePalette('default')
  const sideBg = useColorSchemeStyle(pal.viewLight, pal.view)
  const contentBg = useColorSchemeStyle(pal.view, {
    backgroundColor: pal.colors.background,
    borderColor: pal.colors.border,
    borderLeftWidth: 1,
  })

  const [isKeyboardVisible] = useIsKeyboardVisible()

  if (isMobile) {
    if (scrollable) {
      return (
        <ScrollView
          style={a.flex_1}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={[
            {paddingBottom: isKeyboardVisible ? 300 : 0},
          ]}>
          <View style={a.pt_md}>{children}</View>
        </ScrollView>
      )
    } else {
      return <View style={a.pt_md}>{children}</View>
    }
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
      {scrollable ? (
        <View style={[styles.scrollableContent, contentBg]}>
          <ScrollView
            style={a.flex_1}
            contentContainerStyle={styles.scrollViewContentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={[styles.contentWrapper, IS_WEB && a.my_auto]}>
              {children}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={[styles.content, contentBg]}>
          <View style={styles.contentWrapper}>{children}</View>
        </View>
      )}
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
  scrollableContent: {
    flex: 2,
  },
  scrollViewContentContainer: {
    flex: 1,
    paddingHorizontal: 40,
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
