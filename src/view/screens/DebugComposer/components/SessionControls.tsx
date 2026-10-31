import {useState} from 'react'
import {View} from 'react-native'

import {useGetPost} from '#/state/queries/post'
import {useSession} from '#/state/session'
import {
  SelectMediaButton,
  type SelectMediaButtonProps,
} from '#/view/com/composer/SelectMediaButton'
import {StatusBadgeText} from '#/view/screens/DebugComposer/components/StatusBadge'
import {normalizePostReference} from '#/view/screens/DebugComposer/postUrl'
import {
  buildScenarioInitialState,
  type TesterScenarioId,
} from '#/view/screens/DebugComposer/scenarios'
import {type useTesterSession} from '#/view/screens/DebugComposer/useTesterSession'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useThreadState} from '#/components/ComposerV2/hooks'
import * as TextField from '#/components/forms/TextField'
import {Loader} from '#/components/Loader'
import * as toast from '#/components/Toast'
import {Text} from '#/components/Typography'

type SessionApi = ReturnType<typeof useTesterSession>

const SIMPLE_SCENARIOS: Array<{
  id: Extract<TesterScenarioId, 'empty' | 'text' | 'thread' | 'draft-fixture'>
  testID: string
}> = [
  {id: 'empty', testID: 'debugComposer-scenario-empty'},
  {id: 'text', testID: 'debugComposer-scenario-text'},
  {id: 'thread', testID: 'debugComposer-scenario-thread'},
  {id: 'draft-fixture', testID: 'debugComposer-scenario-draft-fixture'},
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
  const t = useTheme()
  const {currentAccount} = useSession()
  const state = useThreadState()
  const getPost = useGetPost()
  const [url, setUrl] = useState('')
  const postReference = normalizePostReference({reference: url})

  const startReplyOrQuote = (id: 'reply' | 'quote') => {
    if (!postReference) return
    void applyScenario(id, async () => {
      const post = await getPost({uri: postReference})
      return buildScenarioInitialState({id, post})
    })
  }

  const scenarioLabel = (id: TesterScenarioId): string => {
    switch (id) {
      case 'empty':
        return 'Empty'
      case 'text':
        return 'Text & link'
      case 'mention':
        return 'Mention'
      case 'thread':
        return 'Multi-post'
      case 'draft-fixture':
        return 'Adapter fixture'
      case 'reply':
        return 'Reply'
      case 'quote':
        return 'Quote'
      case 'media':
        return 'Initial media'
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
        <Text style={[a.text_md, a.font_bold]}>Session</Text>
        <StatusBadgeText>{session.scenarioId}</StatusBadgeText>
        <StatusBadgeText
          tone={
            isApplyingScenario
              ? 'progress'
              : scenarioError
                ? 'negative'
                : 'positive'
          }>
          {isApplyingScenario
            ? 'building'
            : scenarioError
              ? 'scenario-error'
              : 'ready'}
        </StatusBadgeText>
        {state.isDirty && (
          <StatusBadgeText tone="warning">edited</StatusBadgeText>
        )}
        <Text
          selectable
          style={[
            a.text_xs,
            t.atoms.text_contrast_medium,
            {fontFamily: 'monospace'},
          ]}>
          {session.key}
        </Text>
        {isApplyingScenario && <Loader size="xs" />}
      </View>

      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_xs]}>
        {SIMPLE_SCENARIOS.map(scenario => (
          <Button
            key={scenario.id}
            label={`Start scenario: ${scenarioLabel(scenario.id)}${session.scenarioId === scenario.id ? ' (selected)' : ''}`}
            testID={scenario.testID}
            size="small"
            color={session.scenarioId === scenario.id ? 'primary' : 'secondary'}
            onPress={() =>
              void applyScenario(scenario.id, () =>
                buildScenarioInitialState({id: scenario.id}),
              )
            }>
            <ButtonText>{scenarioLabel(scenario.id)}</ButtonText>
          </Button>
        ))}
        <Button
          label={`Start scenario: Mention${session.scenarioId === 'mention' ? ' (selected)' : ''}`}
          testID="debugComposer-scenario-mention"
          size="small"
          color={session.scenarioId === 'mention' ? 'primary' : 'secondary'}
          disabled={!currentAccount?.handle}
          onPress={() => {
            const handle = currentAccount?.handle
            if (!handle) return
            void applyScenario('mention', () =>
              buildScenarioInitialState({id: 'mention', handle}),
            )
          }}>
          <ButtonText>Mention</ButtonText>
        </Button>
        <View
          style={[a.flex_row, a.align_center, a.gap_2xs]}
          testID="debugComposer-scenario-media">
          <SelectMediaButton
            testID="debugComposer-scenario-media-picker"
            allowedAssetTypes={undefined}
            selectedAssetsCount={0}
            onSelectAssets={onSelectInitialAssets}
          />
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            Initial media
          </Text>
        </View>
        <Button
          label="Reset the current session"
          accessibilityHint="Destroys the session and rebuilds it from its original input"
          testID="debugComposer-reset"
          size="small"
          color="negative_subtle"
          onPress={resetSession}>
          <ButtonText>Reset</ButtonText>
        </Button>
      </View>

      <View
        style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}
        testID="debugComposer-scenario-reply-quote">
        <TextField.Root style={[a.flex_1, {minWidth: 180}]}>
          <TextField.Input
            label="Post URL or at:// URI"
            testID="debugComposer-post-url-input"
            value={url}
            onChangeText={setUrl}
            placeholder="Post URL or at:// URI"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </TextField.Root>
        <Button
          label={`Start reply session${session.scenarioId === 'reply' ? ' (selected)' : ''}`}
          testID="debugComposer-post-url-reply"
          size="small"
          color={session.scenarioId === 'reply' ? 'primary' : 'secondary'}
          disabled={!postReference}
          onPress={() => startReplyOrQuote('reply')}>
          <ButtonText>Reply</ButtonText>
        </Button>
        <Button
          label={`Start quote session${session.scenarioId === 'quote' ? ' (selected)' : ''}`}
          testID="debugComposer-post-url-quote"
          size="small"
          color={session.scenarioId === 'quote' ? 'primary' : 'secondary'}
          disabled={!postReference}
          onPress={() => startReplyOrQuote('quote')}>
          <ButtonText>Quote</ButtonText>
        </Button>
      </View>

      {scenarioError && (
        <Text
          style={[a.text_xs, {color: t.palette.negative_500}]}
          testID="debugComposer-scenario-error">
          Couldn’t start the “{scenarioLabel(scenarioError.scenarioId)}”
          scenario. Check the input and connection, then try again.
        </Text>
      )}
    </View>
  )
}
