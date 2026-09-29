import {useState} from 'react'
import {ScrollView, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {useThreadState} from '#/components/ComposerV2/hooks'
import {type ThreadState} from '#/components/ComposerV2/store/types'
import {getMediaItems} from '#/components/ComposerV2/store/utils/getMediaItems'
import {Text} from '#/components/Typography'

/**
 * Collapsible, redacted structural dump of the live session. It exposes
 * shape and readiness only - never text, captions, alt text, local paths,
 * blob bytes, or auth material. User content appears solely in its actual
 * edit and preview controls.
 */
export function StateSummary() {
  const {t: l} = useLingui()
  const t = useTheme()
  const state = useThreadState()
  const [expanded, setExpanded] = useState(false)

  return (
    <View style={[a.gap_sm]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Text style={[a.text_sm, a.font_bold]}>
          <Trans>State summary (redacted)</Trans>
        </Text>
        <Button
          label={expanded ? l`Collapse state summary` : l`Expand state summary`}
          testID="composerV2Tester-summary-toggle"
          size="tiny"
          color="secondary"
          onPress={() => setExpanded(value => !value)}>
          <ButtonText>
            {expanded ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
          </ButtonText>
        </Button>
      </View>
      {expanded && (
        <View
          style={[
            a.rounded_md,
            a.border,
            t.atoms.border_contrast_low,
            t.atoms.bg_contrast_25,
          ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[a.p_md]}>
            <Text
              style={[a.text_xs, {fontFamily: 'monospace'}]}
              testID="composerV2Tester-summary-dump">
              {JSON.stringify(summarizeThreadState(state), null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

/** Structure and readiness only; safe for screenshots and logs. */
export function summarizeThreadState(state: ThreadState) {
  return {
    postCount: Object.keys(state.posts).length,
    isDirty: state.isDirty,
    hasReplyTarget: !!state.replyTo,
    draftId: state.draftId,
    threadgate:
      state.threadgateAllowRules === undefined
        ? 'everybody'
        : state.threadgateAllowRules.length === 0
          ? 'nobody'
          : `rules:${state.threadgateAllowRules.length}`,
    postgateRuleCount: state.postgateEmbeddingRules.length,
    posts: Object.entries(state.posts).map(([postId, post]) => ({
      postId,
      textLength: post.text.length,
      langCount: post.langs.length,
      labelCount: post.labels.length,
      tagCount: post.tags.length,
      capacity: {
        images: post.imageSelectionsRemaining,
        video: post.videoSelectionsRemaining,
        gif: post.gifSelectionsRemaining,
      },
      record: post.attachments.record?.state ?? 'none',
      media:
        post.attachments.media === undefined
          ? 'none'
          : post.attachments.media.state !== 'resolved'
            ? post.attachments.media.state
            : post.attachments.media.kind,
      mediaItems: getMediaItems(post.attachments.media).map(item => ({
        id: item.id,
        kind: item.kind,
        hasAltText: item.altText.length > 0,
        ...(item.kind === 'video'
          ? {
              captionCount: item.captions.length,
              uploadedCaptionCount: item.captionBlobs.length,
            }
          : {}),
        ...(item.kind !== 'gif'
          ? {
              upload: item.upload.state,
              ...(item.upload.state === 'uploading'
                ? {phase: item.upload.phase, progress: item.upload.progress}
                : {}),
              ...(item.upload.state === 'failed'
                ? {retryable: item.upload.retryable !== false}
                : {}),
            }
          : {}),
      })),
    })),
  }
}
