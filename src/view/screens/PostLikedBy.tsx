import React, {useLayoutEffect} from 'react'
import {TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {makeRecordUri} from '../lib/strings'
import {PostLikedBy as PostLikedByComponent} from '../com/post-thread/PostLikedBy'
import {ScreenParams} from '../routes'

export const PostLikedBy = ({params}: ScreenParams) => {
  const {name, recordKey} = params
  const uri = makeRecordUri(name, 'blueskyweb.xyz:Posts', recordKey)

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: 'Liked By',
  //     headerLeft: () => (
  //       <TouchableOpacity onPress={() => navigation.goBack()}>
  //         <FontAwesomeIcon icon="arrow-left" />
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation])

  return <PostLikedByComponent uri={uri} />
}
