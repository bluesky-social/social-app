import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Shell} from '../../shell'
import type {RootTabsScreenProps} from '../../routes/types'
import {ProfileFollows as ProfileFollowsComponent} from '../../com/profile/ProfileFollows'

export const ProfileFollows = ({
  navigation,
  route,
}: RootTabsScreenProps<'ProfileFollows'>) => {
  const {name} = route.params

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Following',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon="arrow-left" />
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  const onNavigateContent = (screen: string, props: Record<string, string>) => {
    // @ts-ignore it's up to the callers to supply correct params -prf
    navigation.push(screen, props)
  }

  return (
    <Shell>
      <ProfileFollowsComponent
        name={name}
        onNavigateContent={onNavigateContent}
      />
    </Shell>
  )
}
