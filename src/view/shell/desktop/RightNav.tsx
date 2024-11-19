import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useEntitlements} from '#/state/purchases/subscriptions/useEntitlements'
import {useSession} from '#/state/session'
import {DesktopFeeds} from '#/view/shell/desktop/Feeds'
import {DesktopSearch} from '#/view/shell/desktop/Search'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlueskyPlus} from '#/components/dialogs/BlueskyPlus'
import {GradientFill} from '#/components/GradientFill'
import {Logotype} from '#/components/icons/BlueskyPlus'
import {InlineLinkText} from '#/components/Link'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {Text} from '#/components/Typography'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const subscriptionsDialogControl = useDialogControl()
  const {data: entitlements} = useEntitlements()
  const isSubscribed = entitlements?.some(e => e.id === 'core')

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

        {/* TODO NUX this */}
        {!isSubscribed && (
          <View style={[a.pb_lg]}>
            <Button
              onPress={() => subscriptionsDialogControl.open()}
              label={_(msg`Subscribe to Bluesky Plus`)}
              style={[a.p_lg, a.overflow_hidden, a.rounded_md]}>
              <GradientFill
                gradient={tokens.gradients.nordic}
                rotate="270deg"
              />
              <View
                style={[
                  a.absolute,
                  a.inset_0,
                  a.rounded_md,
                  {borderWidth: 2, borderColor: 'white', opacity: 0.1},
                ]}
              />

              <View style={[a.flex_1, a.relative, a.z_10]}>
                <Logotype width={100} fill="white" />

                <View style={[a.pt_xs]}>
                  <Text style={[a.text_sm, a.leading_tight, {color: 'white'}]}>
                    <Trans>
                      Support Bluesky and get access to exclusive features.
                    </Trans>
                  </Text>
                </View>
              </View>
            </Button>
            <BlueskyPlus control={subscriptionsDialogControl} />
          </View>
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
