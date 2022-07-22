import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {AdxUri} from '@adxp/mock-api'
import {Shell} from '../../shell'
import type {RootTabsScreenProps} from '../../routes/types'
import {PostThread as PostThreadComponent} from '../../com/post-thread/PostThread'

export const PostThread = ({
  navigation,
  route,
}: RootTabsScreenProps<'PostThread'>) => {
  const {name, recordKey} = route.params

  const urip = new AdxUri(`adx://todo/`)
  urip.host = name
  urip.collection = 'blueskyweb.xyz:Posts'
  urip.recordKey = recordKey
  const uri = urip.toString()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Thread',
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
      <PostThreadComponent uri={uri} onNavigateContent={onNavigateContent} />
    </Shell>
  )
}
