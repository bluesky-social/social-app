import React from 'react'
import {ScrollView, StyleSheet, useWindowDimensions, View} from 'react-native'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigationState} from '@react-navigation/native'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {getCurrentRoute} from '#/lib/routes/helpers'
import {isNativeTablet, isWeb} from '#/platform/detection'
import {useSession} from '#/state/session'
import {TextLink} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {DesktopFeeds} from './Feeds'
import {DesktopSearch, SearchButton} from './Search'

export function RightNav() {
  const t = useTheme()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const currentRouteInfo = useNavigationState(state => {
    if (!state) {
      return {name: 'Home'}
    }
    return getCurrentRoute(state)
  })
  const {width} = useWindowDimensions()

  const {isTablet} = useWebMediaQueries()
  if (isWeb && isTablet) {
    return null
  }

  // for tablet, we want the main feed to be 600px wide
  const targetWidth = width - 600 - 80 // 600 for main feed, 80 for left nav

  if (isNativeTablet && targetWidth < 250) {
    return null
  }

  return (
    <ScrollView
      style={[
        isWeb
          ? styles.rightNav
          : [
              a.border_l,
              t.atoms.border_contrast_medium,
              a.px_md,
              a.flex_grow_0,
              {width: targetWidth},
              // looks silly beyond 400px
              {maxWidth: 400},
            ],
        t.atoms.bg,
      ]}>
      <View style={a.py_xl}>
        {currentRouteInfo.name.startsWith('Search') ? (
          <View style={{marginBottom: 18}}>
            <DesktopFeeds />
          </View>
        ) : (
          <>
            {isWeb ? <DesktopSearch /> : <SearchButton />}

            {hasSession && (
              <View
                style={[
                  t.atoms.border_contrast_medium,
                  a.border_t,
                  a.my_lg,
                  isWeb && a.border_b,
                ]}>
                <DesktopFeeds />
              </View>
            )}
          </>
        )}

        {isWeb && (
          <View style={[a.pb_lg, a.px_md, hasSession && a.pt_lg]}>
            <View style={[a.flex_wrap, a.flex_row]}>
              {hasSession && (
                <>
                  <TextLink
                    type="md"
                    style={pal.link}
                    href={FEEDBACK_FORM_URL({
                      email: currentAccount?.email,
                      handle: currentAccount?.handle,
                    })}
                    text={_(msg`Feedback`)}
                  />
                  <Text type="md" style={pal.textLight}>
                    &nbsp;&middot;&nbsp;
                  </Text>
                </>
              )}
              <TextLink
                type="md"
                style={pal.link}
                href="https://bsky.social/about/support/privacy-policy"
                text={_(msg`Privacy`)}
              />
              <Text type="md" style={pal.textLight}>
                &nbsp;&middot;&nbsp;
              </Text>
              <TextLink
                type="md"
                style={pal.link}
                href="https://bsky.social/about/support/tos"
                text={_(msg`Terms`)}
              />
              <Text type="md" style={pal.textLight}>
                &nbsp;&middot;&nbsp;
              </Text>
              <TextLink
                type="md"
                style={pal.link}
                href={HELP_DESK_URL}
                text={_(msg`Help`)}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  // @ts-ignore web only
  rightNav: isWeb
    ? {
        position: 'fixed',
        left: 'calc(50vw + 300px + 20px)',
        width: 300,
        maxHeight: '100%',
      }
    : {},
})
