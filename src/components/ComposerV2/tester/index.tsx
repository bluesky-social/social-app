import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {resolveGif} from '#/lib/api/resolve'
import {uploadBlob} from '#/lib/api/upload-blob'
import {useRequireAltTextEnabled} from '#/state/preferences'
import {
  useAppviewClient,
  useChatClient,
  usePdsClient,
  useSession,
} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {
  ThreadStoreProvider,
  useThreadState,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'
import {GateControls} from '#/components/ComposerV2/tester/components/GateControls'
import {PlanSection} from '#/components/ComposerV2/tester/components/PlanSection'
import {PostCard} from '#/components/ComposerV2/tester/components/PostCard'
import {SessionControls} from '#/components/ComposerV2/tester/components/SessionControls'
import {StateSummary} from '#/components/ComposerV2/tester/components/StateSummary'
import {usePlanRunner} from '#/components/ComposerV2/tester/usePlanRunner'
import {useTesterSession} from '#/components/ComposerV2/tester/useTesterSession'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'

/**
 * Full ComposerV2 tester behind Settings > Developer options > Debug Composer
 * V2. It drives the real store/adapters/workers/planner end to end: sessions
 * are isolated and rebuilt from normalized input, media uploads are real,
 * planning never publishes, and nothing entered here is saved anywhere.
 *
 * See ./COVERAGE.md for the capability coverage checklist and test IDs.
 */
export function ComposerV2Tester() {
  const appviewClient = useAppviewClient()
  const chatClient = useChatClient()
  const pdsClient = usePdsClient()
  const {currentAccount} = useSession()
  const {i18n} = useLingui()
  const requireAltTextPreference = useRequireAltTextEnabled()
  const dispatchUrl = currentAccount?.pdsUrl ?? currentAccount?.service

  const sessionApi = useTesterSession({
    accountDid: currentAccount?.did,
    resolvers: {appviewClient, chatClient},
    media: {pdsClient, dispatchUrl, i18n},
  })
  const {session} = sessionApi

  /*
   * Local preflight toggle initialized from the user preference, so the
   * required-alt-text planner contract can be exercised both ways without
   * changing account settings.
   */
  const [requireAltText, setRequireAltText] = useState(
    !!requireAltTextPreference,
  )

  const plan = usePlanRunner({
    session,
    requireAltText,
    dependencies: {
      did: currentAccount?.did ?? '',
      appviewClient,
      resolveGif,
      uploadBlob: async ({path, mime}) =>
        (await uploadBlob(pdsClient, path, mime)).blob,
    },
  })

  return (
    <ThreadStoreProvider store={session.store}>
      <View style={[a.p_md, a.gap_md]} testID="composerV2Tester">
        <Admonition type="info">
          <Trans>
            Tester only: media uploads are real blob uploads, planning never
            publishes records, and nothing here is saved as a draft.
          </Trans>
        </Admonition>
        <SessionControls {...sessionApi} />
        <Divider />
        {/* Keying by session remounts every uncontrolled input on reset. */}
        <View key={session.key} style={[a.gap_md]}>
          <ThreadSection />
          <Divider />
          <GateControls />
          <Divider />
          <PlanSection
            plan={plan}
            requireAltText={requireAltText}
            onChangeRequireAltText={setRequireAltText}
          />
          <Divider />
          <StateSummary />
        </View>
      </View>
    </ThreadStoreProvider>
  )
}

/** The ordered post editors plus thread-level actions. */
function ThreadSection() {
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const state = useThreadState()
  const postIds = Object.keys(state.posts)

  let retryableFailureCount = 0
  for (const post of Object.values(state.posts)) {
    for (const item of getMediaItems(post.attachments.media)) {
      if (
        item.kind !== 'gif' &&
        item.upload.state === 'failed' &&
        item.upload.retryable !== false
      ) {
        retryableFailureCount += 1
      }
    }
  }

  return (
    <View style={[a.gap_md]}>
      {state.replyTo && (
        <View
          style={[
            a.p_sm,
            a.rounded_sm,
            a.border,
            t.atoms.border_contrast_low,
            a.gap_2xs,
          ]}
          testID="composerV2Tester-reply-target">
          <Text style={[a.text_xs, a.font_bold]}>
            <Trans>Replying to @{state.replyTo.author.handle}</Trans>
          </Text>
          <Text emoji style={[a.text_xs]} numberOfLines={2}>
            {state.replyTo.text}
          </Text>
          <Text
            style={[a.text_xs, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {state.replyTo.uri}
          </Text>
        </View>
      )}

      {postIds.map((postId, index) => (
        <PostCard
          key={postId}
          postId={postId}
          index={index}
          isLast={index === postIds.length - 1}
        />
      ))}

      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
        <Button
          label={l`Append a post to the thread`}
          testID="composerV2Tester-add-post"
          size="small"
          color="secondary"
          onPress={() => {
            /* Read live state so we append after the current last post. */
            const ids = Object.keys(store.getState().posts)
            const lastId = ids[ids.length - 1]
            if (lastId) store.actions.addPost('after', lastId)
          }}>
          <ButtonText>
            <Trans>+ Post</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Retry all failed uploads`}
          testID="composerV2Tester-retry-all"
          size="small"
          color="secondary"
          disabled={retryableFailureCount === 0}
          onPress={() => store.actions.retryAllFailedUploads()}>
          <ButtonText>
            <Trans>Retry all failed ({retryableFailureCount})</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
