import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {isInvalidHandle} from '#/lib/strings/handles'
import {EventStopper} from '#/view/com/util/EventStopper'
import {NativeDropdown} from '#/view/com/util/forms/NativeDropdown'
import {NavigationProp} from '#/lib/routes/types'
import {
  usePreferencesQuery,
  useUpsertMutedWordsMutation,
  useRemoveMutedWordMutation,
} from '#/state/queries/preferences'

export function useTagMenuControl() {}

export function TagMenu({
  children,
  tag,
  authorHandle,
}: React.PropsWithChildren<{
  tag: string
  authorHandle?: string
}>) {
  const sanitizedTag = tag.replace(/^#/, '')
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: upsertMutedWord, variables: optimisticUpsert} =
    useUpsertMutedWordsMutation()
  const {mutateAsync: removeMutedWord, variables: optimisticRemove} =
    useRemoveMutedWordMutation()
  const isMuted = Boolean(
    (preferences?.mutedWords?.find(
      m => m.value === sanitizedTag && m.targets.includes('tag'),
    ) ??
      optimisticUpsert?.find(
        m => m.value === sanitizedTag && m.targets.includes('tag'),
      )) &&
      !(optimisticRemove?.value === sanitizedTag),
  )

  const dropdownItems = React.useMemo(() => {
    return [
      {
        label: _(msg`See ${tag} posts`),
        onPress() {
          navigation.navigate('Search', {
            q: tag,
          })
        },
        testID: 'tagMenuSearch',
        icon: {
          ios: {
            name: 'magnifyingglass',
          },
          android: '',
          web: 'magnifying-glass',
        },
      },
      authorHandle &&
        !isInvalidHandle(authorHandle) && {
          label: _(msg`See ${tag} posts by this user`),
          onPress() {
            navigation.navigate({
              name: 'Search',
              params: {
                q: tag + (authorHandle ? ` from:${authorHandle}` : ''),
              },
            })
          },
          testID: 'tagMenuSeachByUser',
          icon: {
            ios: {
              name: 'magnifyingglass',
            },
            android: '',
            web: ['far', 'user'],
          },
        },
      preferences && {
        label: 'separator',
      },
      preferences && {
        label: isMuted ? _(msg`Unmute ${tag}`) : _(msg`Mute ${tag}`),
        onPress() {
          if (isMuted) {
            removeMutedWord({value: sanitizedTag, targets: ['tag']})
          } else {
            upsertMutedWord([{value: sanitizedTag, targets: ['tag']}])
          }
        },
        testID: 'tagMenuMute',
        icon: {
          ios: {
            name: 'speaker.slash',
          },
          android: 'ic_menu_sort_alphabetically',
          web: isMuted ? 'eye' : ['far', 'eye-slash'],
        },
      },
    ].filter(Boolean)
  }, [
    _,
    authorHandle,
    isMuted,
    navigation,
    preferences,
    tag,
    sanitizedTag,
    upsertMutedWord,
    removeMutedWord,
  ])

  return (
    <EventStopper>
      <NativeDropdown
        accessibilityLabel={_(msg`Click here to open tag menu for ${tag}`)}
        accessibilityHint=""
        // @ts-ignore
        items={dropdownItems}>
        {children}
      </NativeDropdown>
    </EventStopper>
  )
}
