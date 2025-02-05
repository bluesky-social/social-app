import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {AppBskyFeedDefs, AppBskyFeedPostgate, AtUri} from '@atproto/api'

import {logger} from '#/logger'
import {useAgent, useSession} from '#/state/session'
import {atoms as a, useGutters} from '#/alf'
import {PostInteractionSettingsForm} from '#/components/dialogs/PostInteractionSettingsDialog'
import * as Layout from '#/components/Layout'
import {Admonition} from '#/components/Admonition'
import {
  createPostgateQueryKey,
  getPostgateRecord,
  usePostgateQuery,
  useWritePostgateMutation,
} from '#/state/queries/postgate'
import {
  createPostgateRecord,
  embeddingRules,
} from '#/state/queries/postgate/util'
import {
  createThreadgateViewQueryKey,
  getThreadgateView,
  ThreadgateAllowUISetting,
  threadgateViewToAllowUISetting,
  useSetThreadgateAllowMutation,
  useThreadgateViewQuery,
  threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate'
import {usePreferencesQuery, UsePreferencesQueryResponse} from '#/state/queries/preferences'
import {Loader} from '#/components/Loader'

export function Screen() {
  const gutters = useGutters(['base'])
  const {data: preferences} = usePreferencesQuery()
  return (
    <Layout.Screen testID="moderationInteractionSettingsScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Post Interaction Settings</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <Layout.Content>
        <View style={[gutters, a.gap_xl]}>
          <Admonition type="tip">
            <Trans>
              The following settings will be applied automatically to all new
              posts you create.
            </Trans>
          </Admonition>
          {preferences ? (
            <Inner preferences={preferences} />
          ) : (
            <View style={[gutters, a.justify_center, a.align_center]}>
              <Loader size='xl' />
            </View>
          )}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Inner({preferences}: {preferences: UsePreferencesQueryResponse}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isSaving, setIsSaving] = React.useState(false)
  console.log(preferences)

  const [postgate, setPostgate] = React.useState(() => {
    return createPostgateRecord({
      post: '',
      embeddingRules: preferences.postInteractionSettings.postgateEmbeddingRules
    })
  })
  const [allowUISettings, setAllowUISettings] = React.useState<ThreadgateAllowUISetting[]>(() => {
    return threadgateRecordToAllowUISetting({
      $type: 'app.bsky.feed.threadgate',
      post: '',
      createdAt: new Date().toString(),
      allow: preferences.postInteractionSettings.threadgateAllowRules
    })
  })

  const onSave = React.useCallback(async () => {
    setIsSaving(true)

    try {
      const requests = []

      if (postgate) {
        // TODO
      }

      if (allowUISettings) {
        // TODO
      }
    } catch (e: any) {
      logger.error(`Failed to save post interaction settings`, {
        context: 'PostInteractionSettingsDialogControlledInner',
        safeMessage: e.message,
      })
    } finally {
      setIsSaving(false)
    }
  }, [
    _,
    postgate,
    allowUISettings,
    setIsSaving,
  ])

  return (
    <>
      <PostInteractionSettingsForm
        isSaving={isSaving}
        onSave={onSave}
        postgate={postgate}
        onChangePostgate={setPostgate}
        threadgateAllowUISettings={allowUISettings}
        onChangeThreadgateAllowUISettings={setAllowUISettings}
      />
    </>
  )
}
