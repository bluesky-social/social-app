import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isInvalidHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {
  usePreferencesQuery,
  useRemoveMutedWordsMutation,
  useUpsertMutedWordsMutation,
} from '#/state/queries/preferences'
import {EventStopper} from '#/view/com/util/EventStopper'
import {NativeDropdown} from '#/view/com/util/forms/NativeDropdown'
import {web} from '#/alf'
import * as Dialog from '#/components/Dialog'

export function useTagMenuControl(): Dialog.DialogControlProps {
  return {
    id: '',
    // @ts-ignore
    ref: null,
    open: () => {
      throw new Error(`TagMenu controls are only available on native platforms`)
    },
    close: () => {
      throw new Error(`TagMenu controls are only available on native platforms`)
    },
  }
}

export function TagMenu({
  children,
  tag,
  authorHandle,
}: React.PropsWithChildren<{
  /**
   * This should be the sanitized tag value from the facet itself, not the
   * "display" value with a leading `#`.
   */
  tag: string
  authorHandle?: string
}>) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync: upsertMutedWord, variables: optimisticUpsert} =
    useUpsertMutedWordsMutation()
  const {mutateAsync: removeMutedWords, variables: optimisticRemove} =
    useRemoveMutedWordsMutation()
  const isMuted = Boolean(
    (preferences?.moderationPrefs.mutedWords?.find(
      m => m.value === tag && m.targets.includes('tag'),
    ) ??
      optimisticUpsert?.find(
        m => m.value === tag && m.targets.includes('tag'),
      )) &&
      !optimisticRemove?.find(m => m?.value === tag),
  )
  const truncatedTag = '#' + enforceLen(tag, 15, true, 'middle')

  /*
   * Mute word records that exactly match the tag in question.
   */
  const removeableMuteWords = React.useMemo(() => {
    return (
      preferences?.moderationPrefs.mutedWords?.filter(word => {
        return word.value === tag
      }) || []
    )
  }, [tag, preferences?.moderationPrefs?.mutedWords])

  const dropdownItems = React.useMemo(() => {
    return [
      {
        label: _(msg`See ${truncatedTag} posts`),
        onPress() {
          navigation.push('Hashtag', {
            tag: encodeURIComponent(tag),
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
          label: _(msg`See ${truncatedTag} posts by user`),
          onPress() {
            navigation.push('Hashtag', {
              tag: encodeURIComponent(tag),
              author: authorHandle,
            })
          },
          testID: 'tagMenuSearchByUser',
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
        label: isMuted
          ? _(msg`Unmute ${truncatedTag}`)
          : _(msg`Mute ${truncatedTag}`),
        onPress() {
          if (isMuted) {
            removeMutedWords(removeableMuteWords)
          } else {
            upsertMutedWord([
              {value: tag, targets: ['tag'], actorTarget: 'all'},
            ])
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
    truncatedTag,
    upsertMutedWord,
    removeMutedWords,
    removeableMuteWords,
  ])

  return (
    <EventStopper>
      <NativeDropdown
        accessibilityLabel={_(msg`Click here to open tag menu for ${tag}`)}
        accessibilityHint=""
        // @ts-ignore
        items={dropdownItems}
        triggerStyle={web({
          textAlign: 'left',
        })}>
        {children}
      </NativeDropdown>
    </EventStopper>
  )
}
