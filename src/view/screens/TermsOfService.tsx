import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {Text} from 'view/com/util/text/Text'
import {TextLink} from 'view/com/util/Link'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {useStores} from 'state/index'
import {ScrollView} from 'view/com/util/Views'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>
export const TermsOfServiceScreen = (_props: Props) => {
  const pal = usePalette('default')
  const store = useStores()

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Terms of Service" />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <Text style={pal.text}>
            The Terms of Service have been moved to{' '}
            <TextLink
              style={pal.link}
              href="https://blueskyweb.xyz/support/tos"
              text="blueskyweb.xyz/support/tos"
            />
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}
