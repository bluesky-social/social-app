import React, {useEffect} from 'react'
import {ProfileFollows as ProfileFollowsComponent} from '../com/profile/ProfileFollows'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'

export const ProfileFollows = ({visible, params}: ScreenParams) => {
  const store = useStores()
  const {name} = params

  useEffect(() => {
    if (visible) {
      store.nav.setTitle('Followers of')
    }
  }, [store, visible])

  return <ProfileFollowsComponent name={name} />
}
