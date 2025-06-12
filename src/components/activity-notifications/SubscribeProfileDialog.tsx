import {useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {useTheme, web} from '#/alf'
import {atoms as a} from '#/alf'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function SubscribeProfileDialog({
  control,
  profile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner profile={profile} />
    </Dialog.Outer>
  )
}

function DialogInner({profile}: {profile: bsky.profile.AnyProfileView}) {
  const {_} = useLingui()
  const t = useTheme()
  const [state, setState] = useState({
    posts: false,
    replies: false,
    corn: false,
  })

  const values = useMemo(() => {
    const {posts, replies, corn} = state
    const res = []
    if (posts) res.push('posts')
    if (replies) res.push('replies')
    if (corn) res.push('corn')
    return res
  }, [state])

  const onChange = (newValues: string[]) =>
    setState({
      posts: newValues.includes('posts'),
      replies: newValues.includes('replies'),
      corn: newValues.includes('corn'),
    })

  const name = createSanitizedDisplayName(profile, false)

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 400})}
      label={_(msg`Get notified of new posts from ${name}`)}>
      <View style={[a.gap_md]}>
        <View style={[a.gap_xs]}>
          <Text style={[a.font_heavy, a.text_2xl]}>
            <Trans>Get notified!</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
            <Trans>Receive notifications when {name} posts</Trans>
          </Text>
        </View>

        <Toggle.Group
          label={_(msg`Subscribe to account activity`)}
          values={values}
          onChange={onChange}>
          <View style={[a.gap_sm]}>
            <Toggle.Item
              label={_(msg`Posts`)}
              name="posts"
              style={[a.justify_between, a.py_xs]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md]}>
                <Trans>Posts</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
            <Toggle.Item
              label={_(msg`Replies`)}
              name="replies"
              style={[a.justify_between, a.py_xs]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md]}>
                <Trans>Replies</Trans>
              </Toggle.LabelText>
              <Toggle.Platform />
            </Toggle.Item>
          </View>
        </Toggle.Group>
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
