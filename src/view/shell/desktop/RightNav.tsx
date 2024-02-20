import React from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {DesktopSearch} from './Search'
import {DesktopFeeds} from './Feeds'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {FEEDBACK_FORM_URL, HELP_DESK_URL} from 'lib/constants'
import {s} from 'lib/styles'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useLingui} from '@lingui/react'
import {msg} from '@lingui/macro'
import {useSession} from '#/state/session'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()

  const {isTablet} = useWebMediaQueries()
  if (isTablet) {
    return null
  }

  return (
    <View style={[styles.rightNav, pal.view]}>
      <View style={{paddingVertical: 20}}>
        {routeName === 'Search' ? (
          <View style={{marginBottom: 18}}>
            <DesktopFeeds />
          </View>
        ) : (
          <>
            <DesktopSearch />

            {hasSession && (
              <View style={[pal.border, styles.desktopFeedsContainer]}>
                <DesktopFeeds />
              </View>
            )}
          </>
        )}

        <View
          style={[
            styles.message,
            {
              paddingTop: hasSession ? 0 : 18,
            },
          ]}>
          <View style={[{flexWrap: 'wrap'}, s.flexRow]}>
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  rightNav: {
    // @ts-ignore web only
    position: 'fixed',
    // @ts-ignore web only
    left: 'calc(50vw + 300px + 20px)',
    width: 300,
    maxHeight: '100%',
    overflowY: 'auto',
  },

  message: {
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  messageLine: {
    marginBottom: 10,
  },
  desktopFeedsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginTop: 18,
    marginBottom: 18,
  },
})
