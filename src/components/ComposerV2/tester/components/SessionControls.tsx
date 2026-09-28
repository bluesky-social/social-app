import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {useGetPost} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {
  SelectMediaButton,
  type SelectMediaButtonProps,
} from '#/view/com/composer/SelectMediaButton'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {normalizePostReference} from '#/components/ComposerV2/tester/postUrl'
import {
  buildScenarioInitialState,
  type TesterScenarioId,
} from '#/components/ComposerV2/tester/scenarios'
import {type useTesterSession} from '#/components/ComposerV2/tester/useTesterSession'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'

type SessionApi = ReturnType<typeof useTesterSession>

const SIMPLE_SCENARIOS: Array<{
  id: Extract<TesterScenarioId, 'empty' | 'text' | 'thread' | 'draft-fixture'>
  testID: string
}> = [
  {id: 'empty', testID: 'composerV2Tester-scenario-empty'},
  {id: 'text', testID: 'composerV2Tester-scenario-text'},
  {id: 'thread', testID: 'composerV2Tester-scenario-thread'},
  {id: 'draft-fixture', testID: 'composerV2Tester-scenario-draft-fixture'},
]

/**
 * Session lifecycle controls: representative initialization scenarios, reset,
 * and the reply/quote/initial-media entry points. Every control replaces the
 * whole session with a store built from normalized initial input.
 */
export function SessionControls({
  session,
  isApplyingScenario,
  scenarioError,
  applyScenario,
  resetSession,
}: SessionApi) {
  const {t: l} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const replyQuoteControl = Dialog.useDialogControl()

  const scenarioLabel = (id: TesterScenarioId): string => {
    switch (id) {
      case 'empty':
        return l`Empty`
      case 'text':
        return l`Text & link`
      case 'mention':
        return l`Mention`
      case 'thread':
        return l`Multi-post`
      case 'draft-fixture':
        return l`Adapter fixture`
      case 'reply':
        return l`Reply`
      case 'quote':
        return l`Quote`
      case 'media':
        return l`Initial media`
    }
  }

  const onSelectInitialAssets: SelectMediaButtonProps['onSelectAssets'] = ({
    type,
    assets,
    errors,
  }) => {
    for (const error of errors) {
      toast.show(error, {type: 'warning'})
    }
    if (assets.length === 0) return
    void applyScenario('media', () =>
      buildScenarioInitialState({id: 'media', picked: {type, assets}}),
    )
  }

  return (
    <View style={[a.gap_sm]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
        <Text style={[a.text_sm, a.font_bold]}>
          <Trans>Session</Trans>
        </Text>
        <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
          {session.key}
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {scenarioLabel(session.scenarioId)}
        </Text>
        {isApplyingScenario && <Loader size="xs" />}
      </View>

      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_xs]}>
        {SIMPLE_SCENARIOS.map(scenario => (
          <Button
            key={scenario.id}
            label={l`Start scenario: ${scenarioLabel(scenario.id)}`}
            testID={scenario.testID}
            size="tiny"
            color="secondary"
            onPress={() =>
              void applyScenario(scenario.id, () =>
                buildScenarioInitialState({id: scenario.id}),
              )
            }>
            <ButtonText>{scenarioLabel(scenario.id)}</ButtonText>
          </Button>
        ))}
        <Button
          label={l`Start scenario: Mention`}
          testID="composerV2Tester-scenario-mention"
          size="tiny"
          color="secondary"
          disabled={!currentAccount?.handle}
          onPress={() => {
            const handle = currentAccount?.handle
            if (!handle) return
            void applyScenario('mention', () =>
              buildScenarioInitialState({id: 'mention', handle}),
            )
          }}>
          <ButtonText>
            <Trans>Mention</Trans>
          </ButtonText>
        </Button>
        <Button
          label={l`Start a reply or quote scenario from a post URL`}
          accessibilityHint={l`Opens a dialog asking for a real post URL`}
          testID="composerV2Tester-scenario-reply-quote"
          size="tiny"
          color="secondary"
          onPress={replyQuoteControl.open}>
          <ButtonText>
            <Trans>Reply / Quote…</Trans>
          </ButtonText>
        </Button>
        <View
          style={[a.flex_row, a.align_center, a.gap_2xs]}
          testID="composerV2Tester-scenario-media">
          <SelectMediaButton
            testID="composerV2Tester-scenario-media-picker"
            allowedAssetTypes={undefined}
            selectedAssetsCount={0}
            onSelectAssets={onSelectInitialAssets}
          />
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            <Trans>Initial media</Trans>
          </Text>
        </View>
        <Button
          label={l`Reset the current session`}
          accessibilityHint={l`Destroys the session and rebuilds it from its original input`}
          testID="composerV2Tester-reset"
          size="tiny"
          color="negative_subtle"
          onPress={resetSession}>
          <ButtonText>
            <Trans>Reset</Trans>
          </ButtonText>
        </Button>
      </View>

      {scenarioError && (
        <Text
          style={[a.text_xs, {color: t.palette.negative_500}]}
          testID="composerV2Tester-scenario-error">
          <Trans>
            Couldn’t start the “{scenarioLabel(scenarioError.scenarioId)}”
            scenario. Check the input and connection, then try again.
          </Trans>
        </Text>
      )}

      <Dialog.Outer control={replyQuoteControl}>
        <Dialog.Handle />
        <ReplyQuoteDialogInner applyScenario={applyScenario} />
      </Dialog.Outer>
    </View>
  )
}

/**
 * Asks for a real post URL, fetches the post, and starts a reply or quote
 * session from the fetched view - refs and previews are never fabricated.
 */
function ReplyQuoteDialogInner({
  applyScenario,
}: {
  applyScenario: SessionApi['applyScenario']
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogContext()
  const getPost = useGetPost()
  const [url, setUrl] = useState('')
  const postReference = normalizePostReference(url)

  const start = (id: 'reply' | 'quote') => {
    if (!postReference) return
    control.close(() => {
      void applyScenario(id, async () => {
        const post = await getPost({uri: postReference})
        return buildScenarioInitialState({id, post})
      })
    })
  }

  return (
    <Dialog.ScrollableInner label={l`Start a reply or quote session`}>
      <View style={[a.gap_md]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Reply or quote a real post</Trans>
        </Text>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          <Trans>
            Paste a bsky.app post URL or at:// URI. The post is fetched from the
            AppView so the session uses its real reference and preview.
          </Trans>
        </Text>
        <TextField.Root>
          <Dialog.Input
            label={l`Post URL`}
            testID="composerV2Tester-post-url-input"
            defaultValue=""
            onChangeText={setUrl}
            placeholder={l`https://bsky.app/profile/…/post/…`}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </TextField.Root>
        <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
          <Button
            label={l`Start a reply session for this post`}
            testID="composerV2Tester-post-url-reply"
            size="small"
            color="primary"
            disabled={!postReference}
            onPress={() => start('reply')}>
            <ButtonText>
              <Trans>Start reply</Trans>
            </ButtonText>
          </Button>
          <Button
            label={l`Start a quote session for this post`}
            testID="composerV2Tester-post-url-quote"
            size="small"
            color="secondary"
            disabled={!postReference}
            onPress={() => start('quote')}>
            <ButtonText>
              <Trans>Start quote</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
