import {StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {s} from '#/lib/styles'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useSession} from '#/state/session'
import {TextLink} from '#/view/com/util/Link'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a} from '#/alf'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {DesktopFeeds} from './Feeds'
import {DesktopSearch} from './Search'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()

  const kawaii = useKawaiiMode()

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
              <>
                <ProgressGuideList style={[{marginTop: 22, marginBottom: 8}]} />
                <View style={[pal.border, styles.desktopFeedsContainer]}>
                  <DesktopFeeds />
                </View>
              </>
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
          <View style={[{flexWrap: 'wrap'}, s.flexRow, a.gap_xs]}>
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
                  &middot;
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
              &middot;
            </Text>
            <TextLink
              type="md"
              style={pal.link}
              href="https://bsky.social/about/support/tos"
              text={_(msg`Terms`)}
            />
            <Text type="md" style={pal.textLight}>
              &middot;
            </Text>
            <TextLink
              type="md"
              style={pal.link}
              href={HELP_DESK_URL}
              text={_(msg`Help`)}
            />
          </View>
          {kawaii && (
            <Text type="md" style={[pal.textLight, {marginTop: 12}]}>
              <Trans>
                Logo by{' '}
                <TextLink
                  type="md"
                  href="/profile/sawaratsuki.bsky.social"
                  text="@sawaratsuki.bsky.social"
                  style={pal.link}
                />
              </Trans>
            </Text>
          )}
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
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    marginBottom: 18,
  },
})
