import React from 'react'
import {StyleProp, Text as RNText, TextStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isInvalidHandle} from '#/lib/strings/handles'
import {isNative, isWeb} from '#/platform/detection'
import {
  usePreferencesQuery,
  useRemoveMutedWordsMutation,
  useUpsertMutedWordsMutation,
} from '#/state/queries/preferences'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {
  createStaticClick,
  createStaticClickIfUnmodified,
  InlineLinkText,
} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'

export function RichTextTag({
  tag,
  display,
  authorHandle,
  textStyle,
}: {
  tag: string
  display: string
  authorHandle?: string
  textStyle: StyleProp<TextStyle>
}) {
  const {_} = useLingui()
  const {isLoading: isPreferencesLoading, data: preferences} =
    usePreferencesQuery()
  const {
    mutateAsync: upsertMutedWord,
    variables: optimisticUpsert,
    reset: resetUpsert,
  } = useUpsertMutedWordsMutation()
  const {
    mutateAsync: removeMutedWords,
    variables: optimisticRemove,
    reset: resetRemove,
  } = useRemoveMutedWordsMutation()
  const navigation = useNavigation<NavigationProp>()
  const label = _(msg`Hashtag ${tag}`)
  const hint = isNative
    ? _(msg`Long press to open tag menu for #${tag}`)
    : _(msg`Click to open tag menu for ${tag}`)

  const isMuted = Boolean(
    (preferences?.moderationPrefs.mutedWords?.find(
      m => m.value === tag && m.targets.includes('tag'),
    ) ??
      optimisticUpsert?.find(
        m => m.value === tag && m.targets.includes('tag'),
      )) &&
      !optimisticRemove?.find(m => m?.value === tag),
  )

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

  return (
    <Menu.Root>
      <Menu.Trigger label={label} hint={hint}>
        {({props: menuProps}) => (
          <InlineLinkText
            to={{
              screen: 'Hashtag',
              params: {tag: encodeURIComponent(tag)},
            }}
            {...menuProps}
            onPress={e => {
              if (isWeb) {
                return createStaticClickIfUnmodified(() => {
                  if (!isNative) {
                    menuProps.onPress()
                  }
                }).onPress(e)
              }
            }}
            onLongPress={createStaticClick(menuProps.onPress).onPress}
            accessibilityHint={hint}
            label={label}
            style={textStyle}>
            {isNative ? (
              display
            ) : (
              <RNText ref={menuProps.ref}>{display}</RNText>
            )}
          </InlineLinkText>
        )}
      </Menu.Trigger>
      <Menu.Outer>
        <Menu.Group>
          <Menu.Item
            label={_(msg`See ${tag} posts`)}
            onPress={() => {
              navigation.push('Hashtag', {
                tag: encodeURIComponent(tag),
              })
            }}>
            <Menu.ItemText>
              <Trans>See #{tag} posts</Trans>
            </Menu.ItemText>
            <Menu.ItemIcon icon={Search} />
          </Menu.Item>
          {authorHandle && !isInvalidHandle(authorHandle) && (
            <Menu.Item
              label={_(msg`See ${tag} posts by user`)}
              onPress={() => {
                navigation.push('Hashtag', {
                  tag: encodeURIComponent(tag),
                  author: authorHandle,
                })
              }}>
              <Menu.ItemText>
                <Trans>See #{tag} posts by user</Trans>
              </Menu.ItemText>
              <Menu.ItemIcon icon={Person} />
            </Menu.Item>
          )}
        </Menu.Group>
        <Menu.Divider />
        <Menu.Item
          label={isMuted ? _(msg`Unmute ${tag}`) : _(msg`Mute ${tag}`)}
          onPress={() => {
            if (isMuted) {
              resetUpsert()
              removeMutedWords(removeableMuteWords)
            } else {
              resetRemove()
              upsertMutedWord([
                {value: tag, targets: ['tag'], actorTarget: 'all'},
              ])
            }
          }}>
          <Menu.ItemText>
            {isMuted ? _(msg`Unmute ${tag}`) : _(msg`Mute ${tag}`)}
          </Menu.ItemText>
          <Menu.ItemIcon icon={isPreferencesLoading ? Loader : Mute} />
        </Menu.Item>
      </Menu.Outer>
    </Menu.Root>
  )
}
