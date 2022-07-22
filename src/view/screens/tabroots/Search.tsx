import React from 'react'
import {Shell} from '../../shell'
import {Text, View} from 'react-native'
import type {RootTabsScreenProps} from '../../routes/types'

export const Search = (_props: RootTabsScreenProps<'SearchTab'>) => {
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Search</Text>
      </View>
    </Shell>
  )
}
