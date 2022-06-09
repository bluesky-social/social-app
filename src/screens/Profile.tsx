import React from 'react'
import {Text} from 'react-native'
import type {RootStackScreenProps} from '../routes/types'

export const Profile = ({route}: RootStackScreenProps<'Profile'>) => {
  return <Text>This is {route.params.name}'s profile</Text>
}
