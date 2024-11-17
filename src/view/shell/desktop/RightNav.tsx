import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useSession} from '#/state/session'
import {DesktopFeeds} from '#/view/shell/desktop/Feeds'
import {DesktopSearch} from '#/view/shell/desktop/Search'
import {atoms as a, useTheme, web} from '#/alf'
import {InlineLinkText} from '#/components/Link'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {Text} from '#/components/Typography'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()

  const kawaii = useKawaiiMode()

  const {isTablet} = useWebMediaQueries()
  if (isTablet) {
    return null
  }

  return (
    <View
      style={[
        web({
          position: 'fixed',
          left: 'calc(50vw + 300px + 20px)',
          width: 300,
          maxHeight: '100%',
          overflowY: 'auto',
        }),
      ]}>
      <View style={[a.py_xl]}>
        {routeName !== 'Search' && (
          <View style={[a.pb_lg]}>
            <DesktopSearch />
          </View>
        )}
        {hasSession && (
          <>
            <ProgressGuideList style={[a.mt_xl, a.mb_sm]} />
            <View
              style={[
                a.pb_lg,
                a.mb_lg,
                a.border_b,
                t.atoms.border_contrast_low,
              ]}>
              <DesktopFeeds />
            </View>
          </>
        )}

        <Text style={[a.leading_snug, t.atoms.text_contrast_low]}>
          {hasSession && (
            <>
              <InlineLinkText
                to={FEEDBACK_FORM_URL({
                  email: currentAccount?.email,
                  handle: currentAccount?.handle,
                })}
                label={_(msg`Feedback`)}>
                {_(msg`Feedback`)}
              </InlineLinkText>
              {' • '}
            </>
          )}
          <InlineLinkText
            to="https://bsky.social/about/support/privacy-policy"
            label={_(msg`Privacy`)}>
            {_(msg`Privacy`)}
          </InlineLinkText>
          {' • '}
          <InlineLinkText
            to="https://bsky.social/about/support/tos"
            label={_(msg`Terms`)}>
            {_(msg`Terms`)}
          </InlineLinkText>
          {' • '}
          <InlineLinkText label={_(msg`Help`)} to={HELP_DESK_URL}>
            {_(msg`Help`)}
          </InlineLinkText>
        </Text>

        {kawaii && (
          <Text style={[t.atoms.text_contrast_medium, {marginTop: 12}]}>
            <Trans>
              Logo by{' '}
              <InlineLinkText
                label={_(msg`Logo by @sawaratsuki.bsky.social`)}
                to="/profile/sawaratsuki.bsky.social">
                @sawaratsuki.bsky.social
              </InlineLinkText>
            </Trans>
          </Text>
        )}
      </View>
    </View>
  )
}
