import React from 'react'
import {View} from 'react-native'

import {CommonNavigatorParams, NativeStackScreenProps} from 'lib/routes/types'
import {CenteredView, ScrollView} from '#/view/com/util/Views'
import {atoms as a, useTheme} from '#/alf'
import {AppComponentRegion} from '#/components/appcom/AppCom'
import {Text} from '#/components/Typography'

export const DebugAppcomScreen = ({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'DebugAppcom'
>) => {
  const t = useTheme()
  const error = '' // TODO

  return (
    <ScrollView>
      <CenteredView style={[t.atoms.bg, a.px_lg, a.py_lg]}>
        <Text style={[a.text_5xl, a.font_bold, a.pb_lg]}>
          Application components
        </Text>

        {error && (
          <View
            style={[
              {backgroundColor: t.palette.negative_500},
              a.px_lg,
              a.py_md,
              a.rounded_sm,
            ]}>
            <Text style={{color: '#fff'}}>{error}</Text>
          </View>
        )}

        <View style={{height: 40}} />

        <AppComponentRegion origin="http://localhost:3001" />
      </CenteredView>
    </ScrollView>
  )
}
