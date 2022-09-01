import React, {useEffect} from 'react'
import {ProfileFollowers as ProfileFollowersComponent} from '../com/profile/ProfileFollowers'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const ProfileFollowers = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle('Followers of')
    }
  }, [store, visible])

  return <ProfileFollowersComponent name={name} />
}
