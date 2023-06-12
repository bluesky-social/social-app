import React from 'react'
import {View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {H1} from '@expo/html-elements'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {ViewHeader} from '../com/util/ViewHeader'
import {useStores} from 'state/index'
import {ScrollView} from 'view/com/util/Views'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import Html from '../../locale/en/copyright-policy'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'CopyrightPolicy'>
export const CopyrightPolicyScreen = (_props: Props) => {
  const pal = usePalette('default')
  const store = useStores()

  useFocusEffect(
    React.useCallback(() => {
      store.shell.setMinimalShellMode(false)
    }, [store]),
  )

  return (
    <View>
      <ViewHeader title="Copyright Policy" />
      <ScrollView style={[s.hContentRegion, pal.view]}>
        <View style={[s.p20]}>
          <H1 style={[pal.text, s.bold, s.pb20, {marginVertical: 0}]}>
            Copyright Policy
          </H1>
          <Html />
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </View>
  )
}
