import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {makeRecordUri} from '../lib/strings'
import {PostRepostedBy as PostRepostedByComponent} from '../com/post-thread/PostRepostedBy'
import {ScreenParams} from '../routes'

export const PostRepostedBy = ({params}: ScreenParams) => {
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'blueskyweb.xyz:Posts', recordKey)

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'Reposted By',
  //     headerLeft: () => (
  //       <TouchableOpacity onPress={() => navigation.goBack()}>
  //         <FontAwesomeIcon icon="arrow-left" />
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation])

  return <PostRepostedByComponent uri={uri} />
}
