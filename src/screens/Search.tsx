import React from 'react'
import {Shell} from '../platform/shell'
import {Text, View} from 'react-native'
import type {RootTabsScreenProps} from '../routes/types'

export const Search = (_props: RootTabsScreenProps<'Search'>) => {
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Search</Text>
      </View>
    </Shell>
  )
}
