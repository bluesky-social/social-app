import React, {useLayoutEffect, useRef} from 'react'
import {Text, TouchableOpacity} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Shell} from '../../shell'
import type {RootTabsScreenProps} from '../../routes/types'
import {Composer as ComposerComponent} from '../../com/composer/Composer'

export const Composer = ({
  navigation,
  route,
}: RootTabsScreenProps<'Composer'>) => {
  const {replyTo} = route.params
  const ref = useRef<{publish: () => Promise<boolean>}>()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: replyTo ? 'Reply' : 'New Post',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon="x" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (!ref.current) {
              return
            }
            ref.current.publish().then(
              posted => {
                if (posted) {
                  navigation.goBack()
                }
              },
              err => console.error('Failed to create post', err),
            )
          }}>
          <Text>Post</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation, replyTo, ref])

  return (
    <Shell>
      <ComposerComponent ref={ref} replyTo={replyTo} />
    </Shell>
  )
}
