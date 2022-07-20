import React from 'react'
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

  const onNavigateContent = (screen: string, props: Record<string, string>) => {
    navigation.navigate(screen, props)
  }
  return (
    <Shell>
      <PostThreadComponent uri={uri} onNavigateContent={onNavigateContent} />
    </Shell>
  )
}
