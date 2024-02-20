import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {NativeDropdown} from '#/view/com/util/forms/NativeDropdown'

export function useTagMenuControl() {}

export function TagMenu({
  children,
  tag,
}: React.PropsWithChildren<{
  tag: string
}>) {
  const {_} = useLingui()

  return (
    <NativeDropdown
      items={[
        {
          label: _(msg`See all posts with ${tag}`),
          onPress() {},
          testID: 'foo',
          icon: {
            ios: {
              name: 'character.book.closed',
            },
            android: 'ic_menu_sort_alphabetically',
            web: 'clipboard',
          },
        },
        {
          label: _(msg`See all posts by this user with ${tag}`),
          onPress() {},
          testID: 'foo',
          icon: {
            ios: {
              name: 'character.book.closed',
            },
            android: 'ic_menu_sort_alphabetically',
            web: 'clipboard',
          },
        },
        {
          label: _(msg`Mute ${tag}`),
          onPress() {},
          testID: 'foo',
          icon: {
            ios: {
              name: 'character.book.closed',
            },
            android: 'ic_menu_sort_alphabetically',
            web: 'clipboard',
          },
        },
      ]}>
      {children}
    </NativeDropdown>
  )
}
