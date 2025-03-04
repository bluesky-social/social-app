import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import deepEqual from 'lodash.isequal'

import {logger} from '#/logger'
import {usePostInteractionSettingsMutation} from '#/state/queries/post-interaction-settings'
import {createPostgateRecord} from '#/state/queries/postgate/util'
import {
  usePreferencesQuery,
  UsePreferencesQueryResponse,
} from '#/state/queries/preferences'
import {
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
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[gutters, a.gap_xl]}>
          <Admonition type="tip">
            <Trans>
              The following settings will be used as your defaults when creating
              new posts. You can edit these for a specific post from the
              composer.
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

  const allowUI = React.useMemo(() => {
    return threadgateRecordToAllowUISetting({
      $type: 'app.bsky.feed.threadgate',
      post: '',
      createdAt: new Date().toString(),
      allow: preferences.postInteractionSettings.threadgateAllowRules,
    })
  }, [preferences.postInteractionSettings.threadgateAllowRules])
  const postgate = React.useMemo(() => {
    return createPostgateRecord({
      post: '',
      embeddingRules:
        preferences.postInteractionSettings.postgateEmbeddingRules,
    })
  }, [preferences.postInteractionSettings.postgateEmbeddingRules])

  const [maybeEditedAllowUI, setAllowUI] = React.useState(allowUI)
  const [maybeEditedPostgate, setEditedPostgate] = React.useState(postgate)

  const wasEdited = React.useMemo(() => {
    return (
      !deepEqual(allowUI, maybeEditedAllowUI) ||
      !deepEqual(postgate.embeddingRules, maybeEditedPostgate.embeddingRules)
    )
  }, [postgate, allowUI, maybeEditedAllowUI, maybeEditedPostgate])

  const onSave = React.useCallback(async () => {
    setError('')

    try {
      await setPostInteractionSettings({
        threadgateAllowRules:
          threadgateAllowUISettingToAllowRecordValue(maybeEditedAllowUI),
        postgateEmbeddingRules: maybeEditedPostgate.embeddingRules ?? [],
      })
      Toast.show(_(msg`Settings saved`))
    } catch (e: any) {
      logger.error(`Failed to save post interaction settings`, {
        source: 'ModerationInteractionSettingsScreen',
        safeMessage: e.message,
      })
      setError(_(msg`Failed to save settings. Please try again.`))
    }
  }, [_, maybeEditedPostgate, maybeEditedAllowUI, setPostInteractionSettings])

  return (
    <>
      <PostInteractionSettingsForm
        canSave={wasEdited}
        isSaving={isPending}
        onSave={onSave}
        postgate={maybeEditedPostgate}
        onChangePostgate={setEditedPostgate}
        threadgateAllowUISettings={maybeEditedAllowUI}
        onChangeThreadgateAllowUISettings={setAllowUI}
      />

      {error && <Admonition type="error">{error}</Admonition>}
    </>
  )
}
