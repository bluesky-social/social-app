import React from 'react'
import {Shell} from '../../shell'
import {View, Text} from 'react-native'
import type {RootTabsScreenProps} from '../../routes/types'

export const Profile = ({route}: RootTabsScreenProps<'Profile'>) => {
  return (
    <Shell>
      <View style={{justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>
          {route.params?.name}'s profile
        </Text>
      </View>
    </Shell>
  )
}
