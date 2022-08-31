import React, {useLayoutEffect, useRef} from 'react'
// import {Text, TouchableOpacity} from 'react-native'
// import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Composer as ComposerComponent} from '../com/composer/Composer'
import {ScreenParams} from '../routes'

export const Composer = ({params}: ScreenParams) => {
  const {replyTo} = params
  const ref = useRef<{publish: () => Promise<boolean>}>()

  // TODO
  // useLayoutEffect(() => {
  //   navigation.setOptions({
  //     headerShown: true,
  //     headerTitle: replyTo ? 'Reply' : 'New Post',
  //     headerLeft: () => (
  //       <TouchableOpacity onPress={() => navigation.goBack()}>
  //         <FontAwesomeIcon icon="x" />
  //       </TouchableOpacity>
  //     ),
  //     headerRight: () => (
  //       <TouchableOpacity
  //         onPress={() => {
  //           if (!ref.current) {
  //             return
  //           }
  //           ref.current.publish().then(
  //             posted => {
  //               if (posted) {
  //                 navigation.goBack()
  //               }
  //             },
  //             err => console.error('Failed to create post', err),
  //           )
  //         }}>
  //         <Text>Post</Text>
  //       </TouchableOpacity>
  //     ),
  //   })
  // }, [navigation, replyTo, ref])

  return <ComposerComponent ref={ref} replyTo={replyTo} />
}
