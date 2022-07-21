import React from 'react'
import {Shell} from '../shell'
import {ScrollView, Text, View} from 'react-native'
import type {RootTabsScreenProps} from '../routes/types'

export const Menu = (_props: RootTabsScreenProps<'MenuTab'>) => {
  return (
    <Shell>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 20, fontWeight: 'bold'}}>Menu</Text>
        </View>
      </ScrollView>
    </Shell>
  )
}
