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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CopyrightPolicy'>
export const CopyrightPolicyScreen = (_props: Props) => {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View>
      <ViewHeader title={_(msg`Copyright Policy`)} />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text style={pal.text}>
            <Trans>
              The Copyright Policy has been moved to{' '}
              <TextLink
                style={pal.link}
                href="https://bsky.social/about/support/copyright"
                text="bsky.social/about/support/copyright"
              />
            </Trans>
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}
