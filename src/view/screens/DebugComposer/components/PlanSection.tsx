import {useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {usePlanErrorHint} from '#/view/screens/DebugComposer/messages'
import {type PlanSummary} from '#/view/screens/DebugComposer/summarizeComposerV2Plan'
import {type usePlanRunner} from '#/view/screens/DebugComposer/usePlanRunner'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type PlanApi = ReturnType<typeof usePlanRunner>

/**
 * No-write planning controls, structural summary, and full generated records.
 * Publishing is a separate explicit action, never part of planning.
 */
export function PlanSection({
  plan,
  requireAltText,
  onChangeRequireAltText,
  accountDid,
  publishAttempted,
  isPublishing,
  onPublishPlan,
}: {
  plan: PlanApi
  requireAltText: boolean
  onChangeRequireAltText: (value: boolean) => void
  accountDid: string | undefined
  publishAttempted: boolean
  isPublishing: boolean
  onPublishPlan: (plan: ComposerV2Plan) => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const planErrorHint = usePlanErrorHint()
  const [showStructure, setShowStructure] = useState(false)
  const [publishingEnabled, setPublishingEnabled] = useState(false)
  const summary = plan.result?.summary
  const successfulPlan = plan.result?.plan
  const canPublish =
    publishingEnabled &&
    !publishAttempted &&
    !plan.isPlanning &&
    !plan.isStale &&
    successfulPlan !== undefined &&
    successfulPlan.input.repo === accountDid

  const needsEmptyPostConfirmation =
    summary !== undefined &&
    !summary.ok &&
    summary.errors.some(
      error => error.code === 'empty-post-requires-confirmation',
    )

  return (
    <View style={[a.gap_sm]}>
      <Text style={[a.text_sm, a.font_bold]}>
        <Trans>No-write record plan</Trans>
      </Text>
      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
        <Button
          label={l`Plan the record set without writing`}
          accessibilityHint={l`Validates and constructs the records locally; nothing is published`}
          testID="composerV2Tester-plan"
          size="small"
          color="primary"
          disabled={plan.isPlanning || publishAttempted}
          onPress={() => void plan.runPlan()}>
          <ButtonText>
            <Trans>Plan records</Trans>
          </ButtonText>
        </Button>
        {needsEmptyPostConfirmation && (
          <Button
            label={l`Confirm skipping empty posts and plan again`}
            testID="composerV2Tester-plan-confirm-skip"
            size="small"
            color="secondary"
            disabled={plan.isPlanning || publishAttempted}
            onPress={() => void plan.runPlan({skipEmptyPostsConfirmed: true})}>
            <ButtonText>
              <Trans>Skip empty posts & re-plan</Trans>
            </ButtonText>
          </Button>
        )}
        {plan.result && (
          <Button
            label={l`Clear the plan result`}
            testID="composerV2Tester-plan-clear"
            size="small"
            color="secondary"
            disabled={publishAttempted}
            onPress={plan.clearPlan}>
            <ButtonText>
              <Trans>Clear</Trans>
            </ButtonText>
          </Button>
        )}
        {plan.isPlanning && <Loader size="sm" />}
      </View>

      <Toggle.Item
        name="requireAltText"
        type="checkbox"
        label={l`Require alt text during planning preflight`}
        value={requireAltText}
        onChange={onChangeRequireAltText}>
        <Toggle.Checkbox />
        <Toggle.LabelText>
          <Trans>Require alt text preflight</Trans>
        </Toggle.LabelText>
      </Toggle.Item>

      <Toggle.Item
        name="enablePublishing"
        type="checkbox"
        label={l`Enable publishing controls for this tester`}
        value={publishingEnabled}
        disabled={publishAttempted}
        testID="composerV2Tester-publish-enable"
        onChange={setPublishingEnabled}>
        <Toggle.Checkbox />
        <Toggle.LabelText>
          <Trans>Enable publishing in this tester</Trans>
        </Toggle.LabelText>
      </Toggle.Item>

      {publishingEnabled && (
        <View style={[a.gap_xs]} testID="composerV2Tester-publish-controls">
          <Text style={[a.text_xs, {color: t.palette.negative_500}]}>
            <Trans>
              Publishing creates real records on the signed-in account. This
              action writes the exact plan shown here; planning alone never
              publishes.
            </Trans>
          </Text>
          <Button
            label={l`Publish the exact planned records to your account`}
            accessibilityHint={l`Writes the current plan to the signed-in account. This cannot be undone here.`}
            testID="composerV2Tester-publish"
            size="small"
            color="primary"
            disabled={!canPublish || isPublishing}
            onPress={() => {
              if (canPublish && successfulPlan) onPublishPlan(successfulPlan)
            }}>
            <ButtonText>
              {isPublishing ? (
                <Trans>Publishing…</Trans>
              ) : (
                <Trans>Publish planned records</Trans>
              )}
            </ButtonText>
          </Button>
        </View>
      )}

      {plan.isStale && (
        <Text
          style={[a.text_xs, {color: t.palette.negative_500}]}
          testID="composerV2Tester-plan-stale">
          <Trans>
            Stale: the composition changed after this plan was captured.
          </Trans>
        </Text>
      )}

      {summary === undefined ? (
        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
          {plan.isPlanning ? (
            <Trans>Planning…</Trans>
          ) : (
            <Trans>No plan yet. Planning never publishes anything.</Trans>
          )}
        </Text>
      ) : summary.ok ? (
        <View style={[a.gap_xs]} testID="composerV2Tester-plan-result">
          <Text style={[a.text_xs, a.font_bold]}>
            <Trans>
              Plan OK: {summary.postCount} posts, {summary.writeCount} writes
            </Trans>
          </Text>
          {summary.posts.map((post, index) => (
            <Text
              key={post.rkey}
              style={[a.text_xs, {fontFamily: 'monospace'}]}
              numberOfLines={2}>
              [{index}] rkey={post.rkey} embed={post.embedType ?? 'none'} reply=
              {post.hasReply ? 'yes' : 'no'} tags={post.tagCount} graphemes=
              {post.textGraphemes}
            </Text>
          ))}
          <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
            {Object.entries(summary.writesByCollection)
              .map(([collection, count]) => `${collection}: ${count}`)
              .join('\n')}
          </Text>
          <Button
            label={
              showStructure
                ? l`Hide final URIs, reply relationships, and gate associations`
                : l`Show final URIs, reply relationships, and gate associations`
            }
            testID="composerV2Tester-plan-structure-toggle"
            size="tiny"
            color="secondary"
            style={[a.self_start]}
            onPress={() => setShowStructure(current => !current)}>
            <ButtonText>
              {showStructure ? (
                <Trans>Hide structure</Trans>
              ) : (
                <Trans>Show structure</Trans>
              )}
            </ButtonText>
          </Button>
          {showStructure && <PlanStructure summary={summary} />}
          <Text style={[a.text_xs, a.font_bold]}>
            <Trans>Generated records (applyWrites)</Trans>
          </Text>
          <Text
            emoji
            selectable
            style={[a.text_xs, {fontFamily: 'monospace'}]}
            testID="composerV2Tester-plan-records">
            {JSON.stringify(plan.result?.writes, null, 2)}
          </Text>
        </View>
      ) : (
        <View style={[a.gap_xs]} testID="composerV2Tester-plan-errors">
          {summary.errors.map((error, index) => (
            <View key={index} style={[a.gap_2xs]}>
              <Text
                style={[
                  a.text_xs,
                  {fontFamily: 'monospace', color: t.palette.negative_500},
                ]}>
                {error.code}
                {error.postIndex !== undefined
                  ? ` (post ${error.postIndex + 1})`
                  : ''}
                {error.collection ? ` [${error.collection}]` : ''}
              </Text>
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                {planErrorHint(error.code)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

/**
 * Expanded structural inspection of a successful plan: each post's final
 * at:// URI, its actual reply root/parent relationship (resolved back to a
 * planned post position when the target is inside this plan), and the gate
 * records associated with it. URIs and record keys only - never record
 * payloads, text, captions, or local paths.
 */
function PlanStructure({summary}: {summary: Extract<PlanSummary, {ok: true}>}) {
  const t = useTheme()

  /** Show in-plan reply targets by position instead of repeating the URI. */
  const describeRef = (uri: string | undefined): string => {
    if (uri === undefined) return 'none'
    const index = summary.posts.findIndex(post => post.uri === uri)
    return index >= 0 ? `post ${index}` : uri
  }

  return (
    <View
      style={[
        a.gap_xs,
        a.p_sm,
        a.rounded_sm,
        a.border,
        t.atoms.border_contrast_low,
      ]}
      testID="composerV2Tester-plan-structure">
      {summary.posts.map((post, index) => {
        const gates = summary.gates.filter(gate => gate.postUri === post.uri)
        return (
          <View
            key={post.rkey}
            style={[a.gap_2xs]}
            testID={`composerV2Tester-plan-post-${index}-structure`}>
            <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
              [{index}] {post.uri}
            </Text>
            <Text
              style={[
                a.text_xs,
                a.pl_md,
                {fontFamily: 'monospace'},
                t.atoms.text_contrast_medium,
              ]}>
              root={describeRef(post.replyRootUri)}
              {'\n'}parent={describeRef(post.replyParentUri)}
              {'\n'}gates=
              {gates.length > 0
                ? gates
                    .map(
                      gate =>
                        `${gate.collection.split('.').pop()}@${gate.rkey}`,
                    )
                    .join(' ')
                : 'none'}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
