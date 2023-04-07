import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {useStores} from 'state/index'
import {ScrollView} from 'view/com/util/Views'
import {Text} from 'view/com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import Html from '../../locale/en/terms-of-service'

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
          <Text type="title-xl" style={[pal.text, s.bold, s.pb20]}>
            Terms of Service
          </Text>
          <Html />
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}
