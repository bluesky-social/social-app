import React, {useCallback} from 'react'
import {ScrollView, View} from 'react-native'
import {msg, plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {DotGrid_Stroke2_Corner0_Rounded as DotsIcon} from '#/components/icons/DotGrid'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import * as Menu from '#/components/Menu'
import {Text} from '#/components/Typography'
import {type ComposerDraft} from '#/storage'
import {type DraftItem, useDraftsList} from './useDraftsList'

/**
 * Inline drafts view - renders directly in the composer
 */
export function DraftsView({
  onSelectDraft,
  onBack,
  onDeleteDraft,
}: {
  onSelectDraft: (draftId: string) => void
  onBack: () => void
  onDeleteDraft?: (draftId: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {drafts, deleteDraft} = useDraftsList()

  const handleDeleteDraft = useCallback(
    (draftId: string) => {
      deleteDraft(draftId)
      onDeleteDraft?.(draftId)
    },
    [deleteDraft, onDeleteDraft],
  )

  return (
    <View style={[a.flex_1]}>
      <View
        style={[a.flex_row, a.align_center, a.px_sm, a.gap_xs, {height: 54}]}>
        <Button
          label={_(msg`Back`)}
          variant="ghost"
          color="primary"
          shape="default"
          size="small"
          style={[a.rounded_full, a.py_sm, {paddingLeft: 7, paddingRight: 7}]}
          onPress={onBack}>
          <ButtonText style={[a.text_md]}>
            <Trans>Back</Trans>
          </ButtonText>
        </Button>
        <View style={[a.flex_1]} />
      </View>

      <ScrollView style={[a.flex_1]} contentContainerStyle={[a.p_lg, a.gap_lg]}>
        <Text style={[a.text_2xl, a.font_semi_bold]}>
          <Trans>Drafts</Trans>
        </Text>

        {drafts.length === 0 ? (
          <View style={[a.py_xl, a.align_center, a.gap_xs]}>
            <Text style={[t.atoms.text_contrast_medium]}>
              <Trans>No drafts yet</Trans>
            </Text>
            <Text style={[t.atoms.text_contrast_low, a.text_center]}>
              <Trans>
                When you close the composer, your post will be saved here.
              </Trans>
            </Text>
          </View>
        ) : (
          <View
            style={[
              a.rounded_lg,
              a.overflow_hidden,
              a.border,
              t.atoms.border_contrast_low,
            ]}>
            {drafts.map((item, index) => (
              <React.Fragment key={item.id}>
                <DraftListItem
                  item={item}
                  onSelect={onSelectDraft}
                  onDelete={handleDeleteDraft}
                />
                {index < drafts.length - 1 && (
                  <View style={[a.border_b, t.atoms.border_contrast_low]} />
                )}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function DraftListItem({
  item,
  onSelect,
  onDelete,
}: {
  item: DraftItem
  onSelect: (draftId: string) => void
  onDelete: (draftId: string) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const {data: profile} = useProfileQuery({did: currentAccount?.did})
  const getTimeAgo = useGetTimeAgo()

  const handleSelect = useCallback(() => {
    onSelect(item.id)
  }, [item.id, onSelect])

  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  const previewText = getPreviewText(item.draft, _)
  const timeAgo = getTimeAgo(item.draft.timestamp, Date.now())

  return (
    <Button
      testID={`draftItem-${item.id}`}
      style={[a.w_full]}
      onPress={handleSelect}
      label={_(msg`Load draft: ${previewText}`)}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.p_lg,
            a.gap_sm,
            (hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          <UserAvatar avatar={profile?.avatar} size={48} type="user" />

          <View style={[a.flex_1, a.gap_2xs, a.pr_md]}>
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Text
                style={[a.font_medium, a.leading_tight, a.text_md]}
                numberOfLines={1}>
                {profile?.displayName || currentAccount?.handle}
              </Text>
              <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
                {timeAgo}
              </Text>
            </View>
            <Text
              style={[a.leading_tight, t.atoms.text_contrast_high]}
              numberOfLines={2}>
              {previewText}
            </Text>
          </View>

          <Menu.Root>
            <Menu.Trigger label={_(msg`Draft options`)}>
              {({props, state}) => (
                <Button
                  {...props}
                  label={_(msg`Draft options`)}
                  size="small"
                  variant="ghost"
                  color="secondary"
                  shape="round"
                  style={[
                    a.justify_center,
                    a.align_center,
                    {width: 34, height: 34},
                    (state.hovered || state.pressed) && t.atoms.bg_contrast_50,
                  ]}>
                  <ButtonIcon icon={DotsIcon} size="md" />
                </Button>
              )}
            </Menu.Trigger>
            <Menu.Outer>
              <Menu.Item
                label={_(msg`Delete draft`)}
                onPress={handleDelete}
                testID="deleteDraftBtn">
                <Menu.ItemIcon icon={TrashIcon} />
                <Menu.ItemText>
                  <Trans>Delete</Trans>
                </Menu.ItemText>
              </Menu.Item>
            </Menu.Outer>
          </Menu.Root>
        </View>
      )}
    </Button>
  )
}

function getPreviewText(
  draft: ComposerDraft,
  _: ReturnType<typeof useLingui>['_'],
): string {
  // Get text from first post
  const firstPost = draft.thread.posts[0]
  if (!firstPost) return ''

  const text = firstPost.text.trim()
  if (text) {
    // Truncate to ~100 chars
    if (text.length > 100) {
      return text.substring(0, 100) + '...'
    }
    return text
  }

  // If no text, describe the media
  if (firstPost.embed.images && firstPost.embed.images.length > 0) {
    const count = firstPost.embed.images.length
    return _(
      plural(count, {
        one: '1 image',
        other: `${count} images`,
      }),
    )
  }

  if (firstPost.embed.gif) {
    return _(msg`GIF`)
  }

  if (firstPost.embed.video) {
    return _(msg`Video`)
  }

  if (firstPost.embed.quoteUri) {
    return _(msg`Quote post`)
  }

  if (firstPost.embed.linkUri) {
    return _(msg`Link`)
  }

  return ''
}
