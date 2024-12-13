import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {NavigationProp} from '#/lib/routes/types'
import {isInvalidHandle} from '#/lib/strings/handles'
import {
  usePreferencesQuery,
  useRemoveMutedWordsMutation,
  useUpsertMutedWordsMutation,
} from '#/state/queries/preferences'
import {atoms as a, native, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {MagnifyingGlass2_Stroke2_Corner0_Rounded as Search} from '#/components/icons/MagnifyingGlass2'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {Person_Stroke2_Corner0_Rounded as Person} from '#/components/icons/Person'
import {createStaticClick, Link} from '#/components/Link'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function useTagMenuControl() {
  return Dialog.useDialogControl()
}

export function TagMenu({
  children,
  control,
  tag,
  authorHandle,
}: React.PropsWithChildren<{
  control: Dialog.DialogOuterProps['control']
  /**
   * This should be the sanitized tag value from the facet itself, not the
   * "display" value with a leading `#`.
   */
  tag: string
  authorHandle?: string
}>) {
  const navigation = useNavigation<NavigationProp>()
  return (
    <>
      {children}
      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <TagMenuInner
          control={control}
          tag={tag}
          authorHandle={authorHandle}
          navigation={navigation}
        />
      </Dialog.Outer>
    </>
  )
}

function TagMenuInner({
  control,
  tag,
  authorHandle,
  navigation,
}: {
  control: Dialog.DialogOuterProps['control']
  tag: string
  authorHandle?: string
  // Passed down because on native, we don't use real portals (and context would be wrong).
  navigation: NavigationProp
}) {
  const {_} = useLingui()
  const t = useTheme()
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
  const displayTag = '#' + tag

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
    <Dialog.Inner label={_(msg`Tag menu: ${displayTag}`)}>
      {isPreferencesLoading ? (
        <View style={[a.w_full, a.align_center]}>
          <Loader size="lg" />
        </View>
      ) : (
        <>
          <View
            style={[
              a.rounded_md,
              a.border,
              a.mb_md,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
            ]}>
            <Link
              label={_(msg`View all posts with tag ${displayTag}`)}
              {...createStaticClick(() => {
                control.close(() => {
                  navigation.push('Hashtag', {
                    tag: encodeURIComponent(tag),
                  })
                })
              })}>
              <View
                style={[
                  a.w_full,
                  a.flex_row,
                  a.align_center,
                  a.justify_start,
                  a.gap_md,
                  a.px_lg,
                  a.py_md,
                ]}>
                <Search size="lg" style={[t.atoms.text_contrast_medium]} />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={[
                    a.flex_1,
                    a.text_md,
                    a.font_bold,
                    native({top: 2}),
                    t.atoms.text_contrast_medium,
                  ]}>
                  <Trans>
                    See{' '}
                    <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                      {displayTag}
                    </Text>{' '}
                    posts
                  </Trans>
                </Text>
              </View>
            </Link>

            {authorHandle && !isInvalidHandle(authorHandle) && (
              <>
                <Divider />

                <Link
                  label={_(
                    msg`View all posts by @${authorHandle} with tag ${displayTag}`,
                  )}
                  {...createStaticClick(() => {
                    control.close(() => {
                      navigation.push('Hashtag', {
                        tag: encodeURIComponent(tag),
                        author: authorHandle,
                      })
                    })
                  })}>
                  <View
                    style={[
                      a.w_full,
                      a.flex_row,
                      a.align_center,
                      a.justify_start,
                      a.gap_md,
                      a.px_lg,
                      a.py_md,
                    ]}>
                    <Person size="lg" style={[t.atoms.text_contrast_medium]} />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={[
                        a.flex_1,
                        a.text_md,
                        a.font_bold,
                        native({top: 2}),
                        t.atoms.text_contrast_medium,
                      ]}>
                      <Trans>
                        See{' '}
                        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                          {displayTag}
                        </Text>{' '}
                        posts by this user
                      </Trans>
                    </Text>
                  </View>
                </Link>
              </>
            )}

            {preferences ? (
              <>
                <Divider />

                <Button
                  label={
                    isMuted
                      ? _(msg`Unmute all ${displayTag} posts`)
                      : _(msg`Mute all ${displayTag} posts`)
                  }
                  onPress={() => {
                    control.close(() => {
                      if (isMuted) {
                        resetUpsert()
                        removeMutedWords(removeableMuteWords)
                      } else {
                        resetRemove()
                        upsertMutedWord([
                          {
                            value: tag,
                            targets: ['tag'],
                            actorTarget: 'all',
                          },
                        ])
                      }
                    })
                  }}>
                  <View
                    style={[
                      a.w_full,
                      a.flex_row,
                      a.align_center,
                      a.justify_start,
                      a.gap_md,
                      a.px_lg,
                      a.py_md,
                    ]}>
                    <Mute size="lg" style={[t.atoms.text_contrast_medium]} />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={[
                        a.flex_1,
                        a.text_md,
                        a.font_bold,
                        native({top: 2}),
                        t.atoms.text_contrast_medium,
                      ]}>
                      {isMuted ? _(msg`Unmute`) : _(msg`Mute`)}{' '}
                      <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                        {displayTag}
                      </Text>{' '}
                      <Trans>posts</Trans>
                    </Text>
                  </View>
                </Button>
              </>
            ) : null}
          </View>

          <Button
            label={_(msg`Close this dialog`)}
            size="small"
            variant="ghost"
            color="secondary"
            onPress={() => control.close()}>
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </>
      )}
    </Dialog.Inner>
  )
}
