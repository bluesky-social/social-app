import {useState} from 'react'
import {View} from 'react-native'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {createPostgateRecord} from '#/state/queries/postgate/util'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {
  mergePostgateEmbeddingRules,
  mergeThreadgateAllowRules,
  splitPostgateEmbeddingRules,
  splitThreadgateAllowRules,
} from '#/view/screens/DebugComposer/gateRules'
import {useThreadgateSummary} from '#/view/screens/DebugComposer/messages'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useThreadState, useThreadStore} from '#/components/ComposerV2/hooks'
import * as Dialog from '#/components/Dialog'
import {PostInteractionSettingsControlledDialog} from '#/components/dialogs/PostInteractionSettingsDialog'
import {Text} from '#/components/Typography'
import {type app} from '#/lexicons'

/**
 * Shared threadgate/postgate controls for the whole composition, backed by
 * the production interaction-settings dialog. Unknown typed rules that the
 * dialog cannot represent are preserved on save and surfaced with an explicit
 * discard control, so editing known settings never silently changes them.
 */
export function GateControls() {
  const {t: l} = useLingui()
  const t = useTheme()
  const store = useThreadStore()
  const state = useThreadState()
  const control = Dialog.useDialogControl()
  const threadgateSummary = useThreadgateSummary()

  const threadgate = splitThreadgateAllowRules(state.threadgateAllowRules)
  const postgate = splitPostgateEmbeddingRules(state.postgateEmbeddingRules)

  const buildDraftPostgate = () =>
    createPostgateRecord({
      post: '',
      embeddingRules: postgate.quotesEnabled
        ? []
        : mergePostgateEmbeddingRules(false, []),
    })

  /* Local draft state for the dialog; committed to the store on save. */
  const [draftSettings, setDraftSettings] = useState<
    ThreadgateAllowUISetting[]
  >(() => threadgate.settings)
  const [draftPostgate, setDraftPostgate] =
    useState<app.bsky.feed.postgate.Main>(buildDraftPostgate)

  const openDialog = () => {
    /*
     * Snapshot the current store state into the drafts, then open. The
     * dialog below stays mounted: a conditionally mounted dialog's control
     * is a detached no-op stub until its Dialog.Outer mounts, which would
     * swallow this first control.open() (see useDialogControl).
     */
    setDraftSettings(threadgate.settings)
    setDraftPostgate(buildDraftPostgate())
    control.open()
  }

  const onSave = () => {
    control.close(() => {
      store.actions.setThreadgateAllowRules(
        mergeThreadgateAllowRules(draftSettings, threadgate.unknownRules),
      )
      const {quotesEnabled} = splitPostgateEmbeddingRules(
        draftPostgate.embeddingRules ?? [],
      )
      store.actions.setPostgateEmbeddingRules(
        mergePostgateEmbeddingRules(quotesEnabled, postgate.unknownRules),
      )
    })
  }

  const summary = threadgateSummary(threadgate.settings)

  return (
    <View style={[a.gap_sm]}>
      <Text style={[a.text_sm, a.font_bold]}>
        <Trans>Interaction gates</Trans>
      </Text>
      <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
        <Button
          label={l`Edit who can reply and quote`}
          accessibilityHint={l`Opens the post interaction settings dialog`}
          testID="composerV2Tester-gates-open"
          size="small"
          color="secondary"
          onPress={openDialog}>
          <ButtonText>
            <Trans>Reply & quote settings</Trans>
          </ButtonText>
        </Button>
        <Text style={[a.text_xs, t.atoms.text_contrast_medium, a.flex_1]}>
          {summary}
          {' · '}
          {postgate.quotesEnabled ? (
            <Trans>quotes allowed</Trans>
          ) : (
            <Trans>quotes disabled</Trans>
          )}
        </Text>
      </View>

      {(threadgate.unknownRules.length > 0 ||
        postgate.unknownRules.length > 0) && (
        <View style={[a.flex_row, a.align_center, a.flex_wrap, a.gap_sm]}>
          <Text style={[a.text_xs, t.atoms.text_contrast_medium, a.flex_1]}>
            <Plural
              value={
                threadgate.unknownRules.length + postgate.unknownRules.length
              }
              one="# unknown gate rule is preserved on edits. While unknown reply rules exist, “Anyone” cannot broaden replies."
              other="# unknown gate rules are preserved on edits. While unknown reply rules exist, “Anyone” cannot broaden replies."
            />
          </Text>
          <Button
            label={l`Discard unknown gate rules`}
            testID="composerV2Tester-gates-discard-unknown"
            size="tiny"
            color="negative_subtle"
            onPress={() => {
              if (threadgate.unknownRules.length > 0) {
                store.actions.setThreadgateAllowRules(
                  mergeThreadgateAllowRules(threadgate.settings, []),
                )
              }
              if (postgate.unknownRules.length > 0) {
                store.actions.setPostgateEmbeddingRules(
                  mergePostgateEmbeddingRules(postgate.quotesEnabled, []),
                )
              }
            }}>
            <ButtonText>
              <Trans>Discard unknown rules</Trans>
            </ButtonText>
          </Button>
        </View>
      )}

      <PostInteractionSettingsControlledDialog
        control={control}
        onSave={onSave}
        postgate={draftPostgate}
        onChangePostgate={setDraftPostgate}
        threadgateAllowUISettings={draftSettings}
        onChangeThreadgateAllowUISettings={setDraftSettings}
      />
    </View>
  )
}
