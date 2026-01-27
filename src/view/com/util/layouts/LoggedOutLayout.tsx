import {ScrollView, StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {FEEDBACK_FORM_URL} from '#/lib/constants'
import {useColorSchemeStyle} from '#/lib/hooks/useColorSchemeStyle'
import {useIsKeyboardVisible} from '#/lib/hooks/useIsKeyboardVisible'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {Divider} from '#/components/Divider'
import {InlineLinkText} from '#/components/Link'
import {Text as NewText} from '#/components/Typography'
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
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile} = useBreakpoints()
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
    const footer = (
      <View style={[a.px_lg]}>
        <Divider />

        <View style={[a.w_full, a.py_lg, a.flex_row, a.gap_md, a.align_center]}>
          <AppLanguageDropdown />
          <NewText
            style={[
              a.flex_1,
              t.atoms.text_contrast_medium,
              !gtMobile && a.text_md,
            ]}>
            <Trans>Having trouble?</Trans>{' '}
            <InlineLinkText
              label={_(msg`Contact support`)}
              to={FEEDBACK_FORM_URL({})}
              style={[!gtMobile && a.text_md]}>
              <Trans>Contact support</Trans>
            </InlineLinkText>
          </NewText>
        </View>
      </View>
    )
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
          {footer}
        </ScrollView>
      )
    } else {
      return (
        <>
          <View style={a.pt_md}>{children}</View>
          {footer}
        </>
      )
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
