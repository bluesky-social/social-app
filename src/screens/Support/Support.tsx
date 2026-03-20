import {useCallback} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {HELP_DESK_URL} from '#/lib/constants'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {useSetMinimalShellMode} from '#/state/shell'
import {atoms as a, native, useGutters, useTheme} from '#/alf'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Arrow'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>
export const SupportScreen = (_props: Props) => {
  const setMinimalShellMode = useSetMinimalShellMode()
  const gutters = useGutters(['wide', 'base'])
  const t = useTheme()

  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

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
        <View style={gutters}>
          <Text style={[a.text_lg, a.leading_snug]}>
            <Trans>
              The support form has been moved. If you need help, please visit{' '}
              <InlineLinkText
                to={HELP_DESK_URL}
                label={HELP_DESK_URL}
                style={[a.text_lg, a.leading_snug]}>
                {HELP_DESK_URL}
                <ExternalLinkIcon
                  size="md"
                  style={[
                    {
                      color: t.palette.primary_500,
                      verticalAlign: 'middle',
                    },
                    native({marginTop: -3}),
                  ]}
                />
              </InlineLinkText>{' '}
              to get in touch with us.
            </Trans>
          </Text>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
