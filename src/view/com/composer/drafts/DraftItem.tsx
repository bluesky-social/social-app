import {Pressable, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {type DraftSummary} from '#/state/drafts'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {Camera_Stroke2_Corner0_Rounded as MediaIcon} from '#/components/icons/Camera'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Text} from '#/components/Typography'

export function DraftItem({
  draft,
  onSelect,
  onDelete,
  isDeleting,
}: {
  draft: DraftSummary
  onSelect: (draft: DraftSummary) => void
  onDelete: (draftId: string) => void
  isDeleting: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()
  const getTimeAgo = useGetTimeAgo()

  const previewText = draft.previewText || _(msg`(No text)`)
  const timeAgo = getTimeAgo(new Date(draft.updatedAt), new Date())

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={_(msg`Open draft: ${previewText}`)}
      accessibilityHint={_(msg`Opens this draft in the composer`)}
      onPress={() => onSelect(draft)}
      style={({pressed, hovered}) => [
        a.flex_row,
        a.align_center,
        a.gap_md,
        a.p_md,
        a.rounded_md,
        t.atoms.bg_contrast_25,
        (pressed || hovered) && t.atoms.bg_contrast_50,
      ]}>
      <View style={[a.flex_1, a.gap_xs]}>
        {/* Reply indicator */}
        {draft.isReply && draft.replyToHandle && (
          <Text
            style={[a.text_xs, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            <Trans>Replying to @{draft.replyToHandle}</Trans>
          </Text>
        )}

        {/* Preview text */}
        <Text style={[a.text_md]} numberOfLines={2}>
          {previewText}
        </Text>

        {/* Metadata row */}
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          {/* Time ago */}
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
            {timeAgo}
          </Text>

          {/* Media indicator */}
          {draft.hasMedia && (
            <View style={[a.flex_row, a.align_center, a.gap_2xs]}>
              <MediaIcon size="xs" style={[t.atoms.text_contrast_medium]} />
              <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                {draft.mediaCount}
              </Text>
            </View>
          )}

          {/* Thread indicator */}
          {draft.postCount > 1 && (
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              <Trans>{draft.postCount} posts</Trans>
            </Text>
          )}
        </View>
      </View>

      {/* Delete button */}
      <Button
        label={_(msg`Delete draft`)}
        variant="ghost"
        color="negative"
        shape="round"
        size="small"
        disabled={isDeleting}
        onPress={e => {
          e.stopPropagation()
          onDelete(draft.id)
        }}>
        <ButtonIcon icon={TrashIcon} />
      </Button>
    </Pressable>
  )
}
