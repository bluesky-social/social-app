import React from 'react'
import {type StyleProp, Text as RNText, type TextStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {isInvalidHandle} from '#/lib/strings/handles'
import {
  usePreferencesQuery,
  useRemoveMutedWordsMutation,
  useUpsertMutedWordsMutation,
} from '#/state/queries/preferences'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {
  createStaticClick,
  createStaticClickIfUnmodified,
  InlineLinkText,
} from '#/components/Link'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import {IS_NATIVE, IS_WEB} from '#/env'

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
  const isCashtag = tag.startsWith('$')
  const label = isCashtag ? _(msg`Cashtag ${tag}`) : _(msg`Hashtag ${tag}`)
  const hint = IS_NATIVE
    ? _(msg`Long press to open tag menu for ${isCashtag ? tag : `#${tag}`}`)
    : _(msg`Click to open tag menu for ${isCashtag ? tag : `#${tag}`}`)

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
              if (IS_WEB) {
                return createStaticClickIfUnmodified(() => {
                  if (!IS_NATIVE) {
                    menuProps.onPress()
                  }
                }).onPress(e)
              }
            }}
            onLongPress={createStaticClick(menuProps.onPress).onPress}
            accessibilityHint={hint}
            label={label}
            style={textStyle}
            emoji>
            {IS_NATIVE ? (
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
            label={_(msg`See ${isCashtag ? tag : `#${tag}`} posts`)}
            onPress={() => {
              navigation.push('Hashtag', {
                tag: encodeURIComponent(tag),
              })
            }}>
            <Menu.ItemText>
              {isCashtag ? (
                <Trans>See {tag} posts</Trans>
              ) : (
                <Trans>See #{tag} posts</Trans>
              )}
            </Menu.ItemText>
            <Menu.ItemIcon icon={Search} />
          </Menu.Item>
          {authorHandle && !isInvalidHandle(authorHandle) && (
            <Menu.Item
              label={_(msg`See ${isCashtag ? tag : `#${tag}`} posts by user`)}
              onPress={() => {
                navigation.push('Hashtag', {
                  tag: encodeURIComponent(tag),
                  author: authorHandle,
                })
              }}>
              <Menu.ItemText>
                {isCashtag ? (
                  <Trans>See {tag} posts by user</Trans>
                ) : (
                  <Trans>See #{tag} posts by user</Trans>
                )}
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
