import {useRef, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {resolveGif} from '#/lib/api/resolve'
import {uploadBlob} from '#/lib/api/upload-blob'
import {useRequireAltTextEnabled} from '#/state/preferences'
import {
  type SessionAccount,
  useAppviewClient,
  useChatClient,
  usePdsClient,
  useSession,
} from '#/state/session'
import {GateControls} from '#/view/screens/DebugComposer/components/GateControls'
import {PlanSection} from '#/view/screens/DebugComposer/components/PlanSection'
import {PostCard} from '#/view/screens/DebugComposer/components/PostCard'
import {SessionControls} from '#/view/screens/DebugComposer/components/SessionControls'
import {StateSummary} from '#/view/screens/DebugComposer/components/StateSummary'
import {usePlanRunner} from '#/view/screens/DebugComposer/usePlanRunner'
import {useTesterSession} from '#/view/screens/DebugComposer/useTesterSession'
import {atoms as a, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {
  ThreadStoreProvider,
  useThreadState,
  useThreadStore,
} from '#/components/ComposerV2/hooks'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'
import {
  ComposerV2WritePreconditionError,
  writeComposerV2Plan,
} from '#/components/ComposerV2/writer'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'

type ComposerV2PublishAttempt =
  | {status: 'writing' | 'uncertain'; plan: ComposerV2Plan}
  | {status: 'published'; plan: ComposerV2Plan; uris: string[]}

/**
 * Full ComposerV2 tester behind Settings > Developer options > Debug Composer
 * V2, lazy-loaded by the screen in ./index.tsx. It drives the real
 * store/adapters/workers/planner end to end: sessions are isolated and rebuilt
 * from normalized input, media uploads are real, planning remains no-write,
 * and publishing is a separate explicit action. Nothing entered here is saved
 * as a draft.
 *
 * See ./COVERAGE.md for the capability coverage checklist and test IDs.
 */
export default function DebugComposer() {
  const {currentAccount} = useSession()
  /*
   * Uploads need an account-scoped PDS client and URL. Without an account
   * there is nothing honest to supply, so no store is constructed.
   */
  if (!currentAccount) {
    return (
      <View style={[a.p_md]}>
        <Admonition type="error">
          <Trans>Sign in to use the ComposerV2 tester.</Trans>
        </Admonition>
      </View>
    )
  }
  return <DebugComposerSession account={currentAccount} />
}

function DebugComposerSession({account}: {account: SessionAccount}) {
  const appviewClient = useAppviewClient()
  const chatClient = useChatClient()
  const pdsClient = usePdsClient()
  const {i18n} = useLingui()
  const analytics = useAnalytics()
  const requireAltTextPreference = useRequireAltTextEnabled()
  const pdsUrl = account.pdsUrl ?? account.service

  const sessionApi = useTesterSession({
    accountDid: account.did,
    resolvers: {appviewClient, chatClient},
    pdsClient,
    pdsUrl,
    i18n,
    analytics,
  })
  const {session} = sessionApi
  const [publishAttempt, setPublishAttempt] =
    useState<ComposerV2PublishAttempt>()
  const publishStartedRef = useRef(false)

  async function publishPlan(plan: ComposerV2Plan) {
    if (publishStartedRef.current) return
    publishStartedRef.current = true
    setPublishAttempt({status: 'writing', plan})
    let uris: string[]
    try {
      const result = await writeComposerV2Plan({
        plan,
        pdsClient,
        onError: session.store.reportError,
      })
      uris = result.uris
    } catch (cause) {
      setPublishAttempt({status: 'uncertain', plan})
      /* A refused write sent nothing, so only a dispatched one is uncertain. */
      if (!(cause instanceof ComposerV2WritePreconditionError)) {
        session.store.reportPublishUncertain({plan, cause})
      }
      return
    }
    setPublishAttempt({status: 'published', plan, uris})
    /* Only a confirmed write publishes; an uncertain one reports nothing. */
    session.store.reportPublished({plan})
  }

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
      did: account.did,
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
            Tester only: media uploads are real blob uploads. Planning never
            publishes records. The optional publisher makes real PDS writes only
            after explicit opt-in and button press; nothing here is saved as a
            draft.
          </Trans>
        </Admonition>
        <SessionControls {...sessionApi} />
        {publishAttempt && <PublishAttemptNotice attempt={publishAttempt} />}
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
            accountDid={account.did}
            publishAttempted={publishAttempt !== undefined}
            isPublishing={publishAttempt?.status === 'writing'}
            onPublishPlan={plan => {
              void publishPlan(plan)
            }}
          />
          <Divider />
          <StateSummary />
        </View>
      </View>
    </ThreadStoreProvider>
  )
}

function PublishAttemptNotice({attempt}: {attempt: ComposerV2PublishAttempt}) {
  const t = useTheme()
  const uris =
    attempt.status === 'published'
      ? attempt.uris
      : attempt.plan.posts.map(post => post.uri)

  return (
    <View
      style={[
        a.gap_2xs,
        a.p_sm,
        a.rounded_sm,
        a.border,
        t.atoms.border_contrast_low,
      ]}
      testID="composerV2Tester-publish-status">
      <Text style={[a.text_xs, a.font_bold]}>
        {attempt.status === 'writing' ? (
          <Trans>Publishing the captured plan…</Trans>
        ) : attempt.status === 'published' ? (
          <Trans>The planned records were published.</Trans>
        ) : (
          <Trans>
            The write failed and its outcome may be uncertain. This exact plan
            is retained; do not retry or replace it until you check these URIs.
          </Trans>
        )}
      </Text>
      <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
        <Trans>Repository: {attempt.plan.input.repo}</Trans>
      </Text>
      <Text
        selectable
        style={[a.text_xs, {fontFamily: 'monospace'}]}
        testID="composerV2Tester-publish-uris">
        {uris.join('\n')}
      </Text>
    </View>
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
    for (const item of getMediaItems({media: post.attachments.media})) {
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
