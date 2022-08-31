import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {ScreenParams} from '../routes'

export const ProfileFollows = ({params}: ScreenParams) => {
  const {name} = params

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'Following',
  //     headerLeft: () => (
  //       <TouchableOpacity onPress={() => navigation.goBack()}>
  //         <FontAwesomeIcon icon="arrow-left" />
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation])

  return <ProfileFollowsComponent name={name} />
}
