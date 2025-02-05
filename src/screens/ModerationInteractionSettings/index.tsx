import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logger} from '#/logger'
import {usePostInteractionSettingsMutation} from '#/state/queries/post-interaction-settings'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {
  usePreferencesQuery,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {
  ThreadgateAllowUISetting,
  threadgateAllowUISettingToAllowRecordValue,
  threadgateRecordToAllowUISetting,
} from '#/state/queries/threadgate'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useGutters} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {PostInteractionSettingsForm} from '#/components/dialogs/PostInteractionSettingsDialog'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'

export function Screen() {
  const gutters = useGutters(['base'])
  const {data: preferences} = usePreferencesQuery()
  return (
    <Layout.Screen testID="ModerationInteractionSettingsScreen">
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
              <Loader size="xl" />
            </View>
          )}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Inner({preferences}: {preferences: UsePreferencesQueryResponse}) {
  const {_} = useLingui()
  const {mutateAsync: setPostInteractionSettings, isPending} =
    usePostInteractionSettingsMutation()
  const [error, setError] = React.useState<string | undefined>(undefined)

  const [postgate, setPostgate] = React.useState(() => {
    return createPostgateRecord({
      post: '',
      embeddingRules:
        preferences.postInteractionSettings.postgateEmbeddingRules,
    })
  })
  const [allowUISettings, setAllowUISettings] = React.useState<
    ThreadgateAllowUISetting[]
  >(() => {
    return threadgateRecordToAllowUISetting({
      $type: 'app.bsky.feed.threadgate',
      post: '',
      createdAt: new Date().toString(),
      allow: preferences.postInteractionSettings.threadgateAllowRules,
    })
  })

  const onSave = React.useCallback(async () => {
    setError('')

    try {
      await setPostInteractionSettings({
        threadgateAllowRules:
          threadgateAllowUISettingToAllowRecordValue(allowUISettings),
        postgateEmbeddingRules: postgate.embeddingRules ?? [],
      })
      Toast.show(_(msg`Settings saved`))
    } catch (e: any) {
      logger.error(`Failed to save post interaction settings`, {
        context: 'ModerationInteractionSettingsScreen',
        safeMessage: e.message,
      })
      setError(_(msg`Failed to save settings. Please try again.`))
    }
  }, [_, postgate, allowUISettings, setPostInteractionSettings])

  return (
    <>
      <PostInteractionSettingsForm
        isSaving={isPending}
        onSave={onSave}
        postgate={postgate}
        onChangePostgate={setPostgate}
        threadgateAllowUISettings={allowUISettings}
        onChangeThreadgateAllowUISettings={setAllowUISettings}
      />

      {error && <Admonition type="error">{error}</Admonition>}
    </>
  )
}
