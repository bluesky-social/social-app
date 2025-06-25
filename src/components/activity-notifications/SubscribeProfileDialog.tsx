import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {isWeb} from '#/platform/detection'
import {platform, useTheme, web} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, type ButtonProps, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function SubscribeProfileDialog({
  control,
  profile,
  moderationOpts,
  includeProfile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  includeProfile?: boolean
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner
        profile={profile}
        moderationOpts={moderationOpts}
        includeProfile={includeProfile}
      />
    </Dialog.Outer>
  )
}

// TEMP - should be derived from profile view
const initialState = {
  posts: false,
  replies: false,
}

function DialogInner({
  profile,
  moderationOpts,
  includeProfile,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  includeProfile?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()

  const [state, setState] = useState(initialState)

  const values = useMemo(() => {
    const {posts, replies} = state
    const res = []
    if (posts) res.push('posts')
    if (replies) res.push('replies')
    return res
  }, [state])

  const onChange = (newValues: string[]) =>
    setState({
      posts: newValues.includes('posts'),
      replies: newValues.includes('replies'),
    })

  const buttonProps: Omit<ButtonProps, 'children'> = useMemo(() => {
    const isDirty =
      state.posts !== initialState.posts ||
      state.replies !== initialState.replies
    const hasAny = state.posts || state.replies

    if (isDirty) {
      return {
        label: _(msg`Save changes`),
        color: hasAny ? 'primary' : 'negative',
      }
    } else {
      // on web, a disabled save button feels more natural than a massive close button
      if (isWeb) {
        return {
          label: _(msg`Save changes`),
          color: 'secondary',
          disabled: true,
        }
      } else {
        return {
          label: _(msg`Cancel`),
          color: 'secondary',
        }
      }
    }
  }, [state, _])

  const name = createSanitizedDisplayName(profile, false)

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 400})}
      label={_(msg`Get notified of new posts from ${name}`)}>
      <View style={[a.gap_lg]}>
        <View style={[a.gap_xs]}>
          <Text style={[a.font_heavy, a.text_2xl]}>
            <Trans>Keep me posted</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
            <Trans>Get notified of this account’s activity</Trans>
          </Text>
        </View>

        {includeProfile && (
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              disabledPreview
            />
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
            />
          </ProfileCard.Header>
        )}

        <Toggle.Group
          label={_(msg`Subscribe to account activity`)}
          values={values}
          onChange={onChange}>
          <View style={[a.gap_sm]}>
            <Toggle.Item
              label={_(msg`Posts`)}
              name="posts"
              style={[
                a.flex_1,
                a.py_xs,
                platform({
                  native: [a.justify_between],
                  web: [a.flex_row_reverse, a.gap_sm],
                }),
              ]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md, a.flex_1]}>
                <Trans>Posts</Trans>
              </Toggle.LabelText>
              <Toggle.Switch />
            </Toggle.Item>
            <Toggle.Item
              label={_(msg`Replies`)}
              name="replies"
              style={[
                a.flex_1,
                a.py_xs,
                platform({
                  native: [a.justify_between],
                  web: [a.flex_row_reverse, a.gap_sm],
                }),
              ]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md, a.flex_1]}>
                <Trans>Replies</Trans>
              </Toggle.LabelText>
              <Toggle.Switch />
            </Toggle.Item>
          </View>
        </Toggle.Group>

        <Button
          {...buttonProps}
          size="large"
          variant="solid"
          onPress={() => control.close()}>
          <ButtonText>{buttonProps.label}</ButtonText>
        </Button>
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
