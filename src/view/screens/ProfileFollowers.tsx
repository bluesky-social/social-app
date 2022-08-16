import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {ScreenParams} from '../routes'

export const ProfileFollowers = ({params}: ScreenParams) => {
  const {name} = params

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'Followers',
  //     headerLeft: () => (
  //       <TouchableOpacity onPress={() => navigation.goBack()}>
  //         <FontAwesomeIcon icon="arrow-left" />
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation])

  return <ProfileFollowersComponent name={name} />
}
