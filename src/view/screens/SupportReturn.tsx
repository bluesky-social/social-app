import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
  type NavigationProp,
} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {STRIPE_API_URL} from '#/env/common'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'SupportReturn'>
export const SupportReturnScreen = (_props: Props) => {
  const {_} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!IS_WEB || !STRIPE_API_URL) {
      setLoading(false)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`${STRIPE_API_URL}/session-status?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.status)
      })
      .catch(() => {
        setStatus('error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleBackToHome = useCallback(() => {
    navigation.navigate('Home')
  }, [navigation])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Support</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.p_xl, a.gap_lg, a.align_center]}>
          {loading ? (
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans>Loading...</Trans>
            </Text>
          ) : status === 'complete' ? (
            <>
              <Text style={[a.text_xl, a.font_bold, a.text_center]}>
                <Trans>Thank you for your support!</Trans>
              </Text>
              <Text
                style={[
                  a.text_md,
                  a.text_center,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Your support helps us maintain and improve the Blacksky
                  community.
                </Trans>
              </Text>
            </>
          ) : status === 'open' ? (
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans>
                Your payment is still being processed. Please check back later.
              </Trans>
            </Text>
          ) : (
            <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
              <Trans>Something went wrong. Please try again.</Trans>
            </Text>
          )}

          <Button
            label={_(msg`Back to Home`)}
            size="large"
            variant="solid"
            color="secondary"
            onPress={handleBackToHome}>
            <ButtonText>
              <Trans>Back to Home</Trans>
            </ButtonText>
          </Button>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
