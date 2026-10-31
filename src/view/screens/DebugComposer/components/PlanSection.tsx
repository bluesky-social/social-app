import {useState} from 'react'
import {ScrollView, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {StatusBadgeText} from '#/view/screens/DebugComposer/components/StatusBadge'
import {usePlanErrorHint} from '#/view/screens/DebugComposer/messages'
import {type PlanSummary} from '#/view/screens/DebugComposer/summarizeComposerV2Plan'
import {type usePlanRunner} from '#/view/screens/DebugComposer/usePlanRunner'
import {atoms as a, useTheme} from '#/alf'
import * as Admonition from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import {type ComposerV2Plan} from '#/components/ComposerV2/planner'
import {Divider} from '#/components/Divider'
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
  publishStatus,
  onPublishPlan,
}: {
  plan: PlanApi
  requireAltText: boolean
  onChangeRequireAltText: (value: boolean) => void
  accountDid: string | undefined
  publishAttempted: boolean
  publishStatus?: 'writing' | 'published' | 'uncertain'
  onPublishPlan: (plan: ComposerV2Plan) => void
}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const planErrorHint = usePlanErrorHint()
  const [showStructure, setShowStructure] = useState(false)
  const [showRecords, setShowRecords] = useState(false)
  const [publishingEnabled, setPublishingEnabled] = useState(false)
  const summary = plan.result?.summary
  const successfulPlan = plan.result?.plan
  const publishChecks = [
    {label: 'enabled', passed: publishingEnabled},
    {label: 'not-attempted', passed: !publishAttempted},
    {label: 'not-planning', passed: !plan.isPlanning},
    {label: 'not-stale', passed: !plan.isStale},
    {label: 'plan-ok', passed: successfulPlan !== undefined},
    {
      label: 'repo-matches',
      passed:
        !!successfulPlan &&
        !!accountDid &&
        successfulPlan.input.repo === accountDid,
    },
  ]
  const canPublish = publishChecks.every(check => check.passed)
  const needsEmptyPostConfirmation =
    summary !== undefined &&
    !summary.ok &&
    summary.error.code === 'empty-post-requires-confirmation'
  const planStatus = publishAttempted
    ? 'locked'
    : plan.isPlanning
      ? 'planning'
      : !summary
        ? 'none'
        : !summary.ok
          ? plan.isStale
            ? 'failed · stale'
            : needsEmptyPostConfirmation
              ? 'failed · needs-confirm'
              : 'failed'
          : plan.isStale
            ? 'ok · stale'
            : 'ok'
  const planTone = publishAttempted
    ? 'neutral'
    : plan.isPlanning
      ? 'progress'
      : !summary
        ? 'neutral'
        : !summary.ok
          ? needsEmptyPostConfirmation
            ? 'warning'
            : 'negative'
          : plan.isStale
            ? 'warning'
            : 'positive'

  return (
    <View style={[a.gap_sm]}>
      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
        <Text style={[a.text_md, a.font_bold]}>Record plan</Text>
        <StatusBadgeText tone={planTone} testID="composerV2Tester-plan-status">
          {planStatus}
        </StatusBadgeText>
        {summary?.ok && (
          <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
            {summary.postCount} {summary.postCount === 1 ? 'post' : 'posts'} ·{' '}
            {summary.writeCount} {summary.writeCount === 1 ? 'write' : 'writes'}
          </Text>
        )}
      </View>
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
        {needsEmptyPostConfirmation && !plan.isStale && (
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
          <ScrollView
            horizontal
            contentContainerStyle={[a.p_sm]}
            style={[a.rounded_sm, t.atoms.bg_contrast_50]}>
            <View style={[a.gap_2xs]}>
              {summary.posts.map((post, index) => (
                <Text
                  key={post.rkey}
                  style={[a.text_xs, {fontFamily: 'monospace'}]}>
                  [{index}] rkey={post.rkey} embed={post.embedType ?? 'none'}{' '}
                  reply=
                  {post.hasReply ? 'yes' : 'no'} tags={post.tagCount} graphemes=
                  {post.textGraphemes}
                </Text>
              ))}
              <Text style={[a.text_xs, {fontFamily: 'monospace'}]}>
                {Object.entries(summary.writesByCollection)
                  .map(([collection, count]) => `${collection}: ${count}`)
                  .join(' · ')}
              </Text>
            </View>
          </ScrollView>
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
          <Button
            label={
              showRecords
                ? 'Hide generated records JSON'
                : 'Show generated records JSON'
            }
            testID="composerV2Tester-plan-records-toggle"
            size="tiny"
            color="secondary"
            style={[a.self_start]}
            onPress={() => setShowRecords(value => !value)}>
            <ButtonText>
              {showRecords ? 'Hide records JSON' : 'Show records JSON'}
            </ButtonText>
          </Button>
          {showRecords && (
            <ScrollView
              horizontal
              contentContainerStyle={[a.p_sm]}
              style={[a.rounded_sm, t.atoms.bg_contrast_50]}>
              <Text
                emoji
                selectable
                style={[a.text_xs, {fontFamily: 'monospace'}]}
                testID="composerV2Tester-plan-records">
                {JSON.stringify(plan.result?.writes, null, 2)}
              </Text>
            </ScrollView>
          )}
        </View>
      ) : (
        <View testID="composerV2Tester-plan-error">
          <Admonition.Outer
            type={needsEmptyPostConfirmation ? 'warning' : 'error'}>
            <Admonition.Row>
              <Admonition.Icon />
              <Admonition.Content>
                <Text
                  style={[
                    a.text_xs,
                    {fontFamily: 'monospace', color: t.palette.negative_500},
                  ]}>
                  {summary.error.code}
                  {summary.error.postIndex !== undefined
                    ? ` (post ${summary.error.postIndex + 1})`
                    : ''}
                  {summary.error.mediaId
                    ? ` · media ${summary.error.mediaId}`
                    : ''}
                  {summary.error.collection
                    ? ` [${summary.error.collection}]`
                    : ''}
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                  {planErrorHint(summary.error.code)}
                </Text>
              </Admonition.Content>
            </Admonition.Row>
          </Admonition.Outer>
        </View>
      )}

      <Divider />
      <View style={[a.gap_sm]} testID="composerV2Tester-publish-controls">
        <View style={[a.flex_row, a.align_center, a.gap_sm, a.flex_wrap]}>
          <Text style={[a.text_md, a.font_bold]}>Publish</Text>
          <StatusBadgeText
            tone={
              publishStatus === 'writing'
                ? 'progress'
                : publishStatus === 'published'
                  ? 'positive'
                  : publishStatus === 'uncertain'
                    ? 'warning'
                    : 'neutral'
            }>
            {publishStatus ?? 'not-attempted'}
          </StatusBadgeText>
        </View>
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
        {publishingEnabled && !publishAttempted && (
          <Admonition.Admonition type="error">
            Publishing creates real records on{' '}
            {accountDid ?? 'the signed-in account'}. One attempt per visit. This
            writes the exact plan shown here.
          </Admonition.Admonition>
        )}
        <View
          style={[a.flex_row, a.flex_wrap, a.gap_sm]}
          testID="composerV2Tester-publish-gates">
          {publishChecks.map(check => (
            <Text
              key={check.label}
              style={[
                a.text_xs,
                {
                  fontFamily: 'monospace',
                  color: check.passed
                    ? t.palette.positive_700
                    : t.palette.negative_700,
                },
              ]}>
              {check.passed ? '✓' : '✗'} {check.label}
            </Text>
          ))}
        </View>
        <Button
          label={l`Publish the exact planned records to your account`}
          accessibilityHint={l`Writes the current plan to the signed-in account. This cannot be undone here.`}
          testID="composerV2Tester-publish"
          size="small"
          color={canPublish ? 'negative' : 'secondary'}
          style={[a.self_start]}
          disabled={!canPublish}
          onPress={() => {
            if (canPublish && successfulPlan) onPublishPlan(successfulPlan)
          }}>
          <ButtonText>
            {publishStatus === 'writing'
              ? 'Publishing…'
              : 'Publish planned records'}
          </ButtonText>
        </Button>
        {publishAttempted && (
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            Locked until you leave this screen. Reset doesn’t unlock.
          </Text>
        )}
      </View>
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
