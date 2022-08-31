import React, {useEffect, useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {makeRecordUri} from '../lib/strings'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ScreenParams} from '../routes'
import {useStores} from '../../state'
import {useLoadEffect} from '../lib/navigation'

export const PostThread = ({params}: ScreenParams) => {
  const store = useStores()
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'blueskyweb.xyz:Posts', recordKey)
  useLoadEffect(() => {
    store.nav.setTitle(`Post by ${name}`)
  }, [store.nav, name])

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'Thread',
  //     headerLeft: () => (
  //       <TouchableOpacity onPress={() => navigation.goBack()}>
  //         <FontAwesomeIcon icon="arrow-left" />
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation])

  return <PostThreadComponent uri={uri} />
}
