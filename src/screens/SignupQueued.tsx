import React from 'react'
import {Modal, ScrollView, View} from 'react-native'
import {SystemBars} from 'react-native-edge-to-edge'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {isSignupQueued, useAgent, useSessionApi} from '#/state/session'
import {useOnboardingDispatch} from '#/state/shell'
import {Logo} from '#/view/icons/Logo'
import {atoms as a, native, useBreakpoints, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Loader} from '#/components/Loader'
import {P, Text} from '#/components/Typography'
import {IS_IOS, IS_WEB} from '#/env'

const COL_WIDTH = 400

export function SignupQueued() {
  const {_} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()
  const onboardingDispatch = useOnboardingDispatch()
  const {logoutCurrentAccount} = useSessionApi()
  const agent = useAgent()

  const [isProcessing, setProcessing] = React.useState(false)
  const [estimatedTime, setEstimatedTime] = React.useState<string | undefined>(
    undefined,
  )
  const [placeInQueue, setPlaceInQueue] = React.useState<number | undefined>(
    undefined,
  )

  const checkStatus = React.useCallback(async () => {
    setProcessing(true)
    try {
      const res = await agent.com.atproto.temp.checkSignupQueue()
      if (res.data.activated) {
        // ready to go, exchange the access token for a usable one and kick off onboarding
        await agent.sessionManager.refreshSession()
        if (!isSignupQueued(agent.session?.accessJwt)) {
          onboardingDispatch({type: 'start'})
        }
      } else {
        // not ready, update UI
        setEstimatedTime(msToString(res.data.estimatedTimeMs))
        if (typeof res.data.placeInQueue !== 'undefined') {
          setPlaceInQueue(Math.max(res.data.placeInQueue, 1))
        }
      }
    } catch (e: any) {
      logger.error('Failed to check signup queue', {err: e.toString()})
    } finally {
      setProcessing(false)
    }
  }, [
    setProcessing,
    setEstimatedTime,
    setPlaceInQueue,
    onboardingDispatch,
    agent,
  ])

  React.useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 60e3)
    return () => clearInterval(interval)
  }, [checkStatus])

  const checkBtn = (
    <Button
      variant="solid"
      color="primary"
      size="large"
      label={_(msg`Check my status`)}
      onPress={checkStatus}
      disabled={isProcessing}>
      <ButtonText>
        <Trans>Check my status</Trans>
      </ButtonText>
      {isProcessing && <ButtonIcon icon={Loader} />}
    </Button>
  )

  const logoutBtn = (
    <Button
      variant="ghost"
      size="large"
      color="primary"
      label={_(msg`Sign out`)}
      onPress={() => logoutCurrentAccount('SignupQueued')}>
      <ButtonText>
        <Trans>Sign out</Trans>
      </ButtonText>
    </Button>
  )

  const webLayout = IS_WEB && gtMobile

  return (
    <Modal
      visible
      animationType={native('slide')}
      presentationStyle="formSheet"
      style={[web(a.util_screen_outer)]}>
      {IS_IOS && <SystemBars style={{statusBar: 'light'}} />}
      <ScrollView
        style={[a.flex_1, t.atoms.bg]}
        contentContainerStyle={{borderWidth: 0}}
        bounces={false}>
        <View
          style={[
            a.flex_row,
            a.justify_center,
            gtMobile ? a.pt_4xl : [a.px_xl, a.pt_xl],
          ]}>
          <View style={[a.flex_1, {maxWidth: COL_WIDTH}]}>
            <View
              style={[a.w_full, a.justify_center, a.align_center, a.my_4xl]}>
              <Logo width={120} />
            </View>

            <Text style={[a.text_4xl, a.font_bold, a.pb_sm]}>
              <Trans>You're in line</Trans>
            </Text>
            <P style={[t.atoms.text_contrast_medium]}>
              <Trans>
                There's been a rush of new users to Bluesky! We'll activate your
                account as soon as we can.
              </Trans>
            </P>

            <View
              style={[
                a.rounded_sm,
                a.px_2xl,
                a.py_4xl,
                a.mt_2xl,
                a.mb_md,
                a.border,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_medium,
              ]}>
              {typeof placeInQueue === 'number' && (
                <Text
                  style={[a.text_5xl, a.text_center, a.font_bold, a.mb_2xl]}>
                  {placeInQueue}
                </Text>
              )}
              <P style={[a.text_center]}>
                {typeof placeInQueue === 'number' ? (
                  <Trans>left to go.</Trans>
                ) : (
                  <Trans>You are in line.</Trans>
                )}{' '}
                {estimatedTime ? (
                  <Trans>
                    We estimate {estimatedTime} until your account is ready.
                  </Trans>
                ) : (
                  <Trans>
                    We will let you know when your account is ready.
                  </Trans>
                )}
              </P>
            </View>

            {webLayout && (
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.justify_between,
                  a.pt_5xl,
                  {paddingBottom: 200},
                ]}>
                {logoutBtn}
                {checkBtn}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {!webLayout && (
        <View
          style={[
            a.align_center,
            t.atoms.bg,
            gtMobile ? a.px_5xl : a.px_xl,
            {paddingBottom: Math.max(insets.bottom, a.pb_5xl.paddingBottom)},
          ]}>
          <View style={[a.w_full, a.gap_sm, {maxWidth: COL_WIDTH}]}>
            {checkBtn}
            {logoutBtn}
          </View>
        </View>
      )}
    </Modal>
  )
}

function msToString(ms: number | undefined): string | undefined {
  if (ms && ms > 0) {
    const estimatedTimeMins = Math.ceil(ms / 60e3)
    if (estimatedTimeMins > 59) {
      const estimatedTimeHrs = Math.round(estimatedTimeMins / 60)
      if (estimatedTimeHrs > 6) {
        // dont even bother
        return undefined
      }
      // hours
      return `${estimatedTimeHrs} ${plural(estimatedTimeHrs, {
        one: 'hour',
        other: 'hours',
      })}`
    }
    // minutes
    return `${estimatedTimeMins} ${plural(estimatedTimeMins, {
      one: 'minute',
      other: 'minutes',
    })}`
  }
  return undefined
}
