import {useCallback} from 'react'
import {View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {useSetMinimalShellMode} from '#/state/shell'
import {atoms as a, native, useGutters, useTheme} from '#/alf'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ExternalLinkIcon} from '#/components/icons/Arrow'
import * as Layout from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'

/**
 * Generic screen component for redirects.
 */
export function RedirectTemplate({title, link}: {title: string; link: string}) {
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
          <Layout.Header.TitleText>{title}</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={gutters}>
          <Text style={[a.text_lg, a.leading_snug]}>
            <Trans>
              The {title} has been moved to{' '}
              <InlineLinkText
                to={link}
                label={link}
                style={[a.text_lg, a.leading_snug]}>
                {link}
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
              </InlineLinkText>
            </Trans>
          </Text>
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}
