import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {makeRecordUri} from '../lib/strings'
import {PostThread as PostThreadComponent} from '../com/post-thread/PostThread'
import {ScreenParams} from '../routes'

export const PostThread = ({params}: ScreenParams) => {
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'blueskyweb.xyz:Posts', recordKey)

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
