import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {ScrollView} from 'view/com/util/Views'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {useSetMinimalShellMode} from '#/state/shell'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>
export const TermsOfServiceScreen = (_props: Props) => {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {_} = useLingui()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Terms of Service`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text style={pal.text}>
            <Trans>The Terms of Service have been moved to</Trans>{' '}
            <TextLink
              style={pal.link}
              href="https://bsky.social/about/support/tos"
              text="bsky.social/about/support/tos"
            />
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}
