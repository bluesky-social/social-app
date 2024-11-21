import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FEEDBACK_FORM_URL, HELP_DESK_URL} from '#/lib/constants'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {useKawaiiMode} from '#/state/preferences/kawaii'
import {usePurchases} from '#/state/purchases'
import {EntitlementId} from '#/state/purchases/types'
import {Nux, useNux, useResetNuxs,useSaveNux} from '#/state/queries/nuxs'
import {useSession} from '#/state/session'
import {DesktopFeeds} from '#/view/shell/desktop/Feeds'
import {DesktopSearch} from '#/view/shell/desktop/Search'
import {atoms as a, tokens, useTheme, web} from '#/alf'
import {Button} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {BlueskyPlus} from '#/components/dialogs/BlueskyPlus'
import {Divider} from '#/components/Divider'
import {GradientFill} from '#/components/GradientFill'
import {Full as BlueskyPlusLogo} from '#/components/icons/BlueskyPlus'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as SquareArrowTopRight} from '#/components/icons/SquareArrowTopRight'
import {createStaticClick,InlineLinkText} from '#/components/Link'
import {ProgressGuideList} from '#/components/ProgressGuide/List'
import {Text} from '#/components/Typography'
import {IS_DEV} from '#/env'

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession, currentAccount} = useSession()
  const kawaii = useKawaiiMode()
  const bskyPlusDialogControl = useDialogControl()

  const {mutateAsync: resetNuxs} = useResetNuxs()
  const nux = useNux(Nux.BlueskyPlus_Core_RightNav)
  const {mutateAsync: saveNux} = useSaveNux()
  const purchases = usePurchases()
  const [hideNux, setHideNux] = React.useState(false)
  const bskyPlusNux = React.useMemo(() => {
    const purchasesReady = purchases.status === 'ready'
    const nuxReady = nux.status === 'ready'
    const ready = purchasesReady && nuxReady
    const subscribed =
      purchasesReady &&
      purchases.entitlements.some(e => e.id === EntitlementId.Core)
    const nuxSeen = Boolean(nuxReady && nux.nux)
    const active = !ready
      ? false
      : subscribed || nuxSeen
      ? false
      : hideNux
      ? false
      : true
    return {
      active,
      nuxSeen,
    }
  }, [hideNux, nux, purchases])

  const onPressBlueskyPlusNux = () => {
    setHideNux(true)
    bskyPlusDialogControl.open()
    saveNux({
      id: Nux.BlueskyPlus_Core_RightNav,
      completed: true,
      data: undefined,
    }).catch(_e => {})
  }

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

        {bskyPlusNux.active ? (
          <View style={[a.pb_lg]}>
            <Button
              onPress={onPressBlueskyPlusNux}
              label={_(msg`Subscribe to Bluesky Plus`)}
              style={[a.p_lg, a.overflow_hidden, a.rounded_md]}>
              {({hovered}) => (
                <>
                  <GradientFill gradient={tokens.gradients.nordic} />
                  <View
                    style={[
                      a.absolute,
                      t.atoms.bg,
                      {
                        borderRadius: 8,
                        top: a.pt_xs.paddingTop,
                        bottom: a.pt_xs.paddingTop,
                        left: a.pt_xs.paddingTop,
                        right: a.pt_xs.paddingTop,
                      },
                    ]}>
                    {hovered && (
                      <GradientFill
                        gradient={tokens.gradients.nordic}
                        style={{opacity: 0.1}}
                      />
                    )}
                  </View>

                  <View style={[a.flex_1, a.relative, a.z_10, a.gap_sm]}>
                    <View style={[a.flex_row, a.justify_between]}>
                      <BlueskyPlusLogo width={100} gradient="nordic" />
                      <SquareArrowTopRight
                        fill={t.atoms.text_contrast_low.color}
                        size="md"
                      />
                    </View>

                    <Divider />

                    <View style={[a.flex_row, a.justify_between]}>
                      <Text
                        style={[
                          a.text_sm,
                          a.leading_snug,
                          t.atoms.text_contrast_medium,
                        ]}>
                        <Trans>Subscribe now</Trans>
                      </Text>
                      <Text style={[a.text_sm, a.font_heavy, a.leading_snug]}>
                        <Trans>$8 / month</Trans>
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </Button>
          </View>
        ) : (
          <>
            {bskyPlusNux.nuxSeen && IS_DEV && (
              <View
                style={[
                  a.rounded_sm,
                  a.p_md,
                  a.border,
                  a.mb_lg,
                  t.atoms.border_contrast_low,
                ]}>
                <Text style={[a.font_bold]}>
                  Dev only:{' '}
                  <InlineLinkText
                    label="Dev only reset NUX"
                    {...createStaticClick(() => {
                      setHideNux(false)
                      resetNuxs([Nux.BlueskyPlus_Core_RightNav])
                    })}>
                    reset Bluesky+ NUX
                  </InlineLinkText>
                </Text>
              </View>
            )}
          </>
        )}

        <BlueskyPlus control={bskyPlusDialogControl} />

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
