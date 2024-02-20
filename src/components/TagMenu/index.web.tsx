import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {EventStopper} from '#/view/com/util/EventStopper'
import {NativeDropdown} from '#/view/com/util/forms/NativeDropdown'
import {NavigationProp} from '#/lib/routes/types'

export function useTagMenuControl() {}

export function TagMenu({
  children,
  tag,
  authorHandle,
}: React.PropsWithChildren<{
  tag: string
  authorHandle?: string
}>) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  return (
    <EventStopper>
      <NativeDropdown
        items={[
          {
            label: _(msg`See ${tag} posts`),
            onPress() {
              navigation.navigate('Search', {
                q: tag,
              })
            },
            // testID: 'foo',
            icon: {
              ios: {
                name: 'magnifyingglass',
              },
              android: '',
              web: 'magnifying-glass',
            },
          },
          {
            label: _(msg`See ${tag} posts by this user`),
            onPress() {
              navigation.navigate({
                name: 'Search',
                params: {
                  q: tag + (authorHandle ? ` from:${authorHandle}` : ''),
                },
              })
            },
            // testID: 'foo',
            icon: {
              ios: {
                name: 'magnifyingglass',
              },
              android: '',
              web: 'user',
            },
          },
          {
            label: 'separator',
          },
          {
            label: _(msg`Mute ${tag}`),
            onPress() {},
            // testID: 'foo',
            icon: {
              ios: {
                name: 'speaker.slash',
              },
              android: 'ic_menu_sort_alphabetically',
              web: 'eye-slash',
            },
          },
        ]}>
        {children}
      </NativeDropdown>
    </EventStopper>
  )
}
