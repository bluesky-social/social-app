import {View} from 'react-native'
import {type AppBskyFeedPost} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {getPostEditInfo} from '#/lib/edit-post'
import {atoms as a, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

/**
 * The "· Edited" badge next to a post's timestamp. Renders nothing unless the
 * post was edited; tapping it opens the original-vs-current history.
 */
export function PostEditedIndicator({
  record,
  size = 'md',
}: {
  record: AppBskyFeedPost.Record
  size?: 'sm' | 'md'
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const control = Dialog.useDialogControl()
  const {isEdited, originalText, updatedAt} = getPostEditInfo(record)

  if (!isEdited) {
    return null
  }

  return (
    <>
      <Text
        accessibilityRole="button"
        accessibilityLabel={l`View edit history`}
        accessibilityHint={l`Opens the original and edited versions of this post`}
        onPress={() => control.open()}
        style={[
          a.pl_xs,
          size === 'sm' ? a.text_sm : a.text_md,
          a.leading_tight,
          t.atoms.text_contrast_medium,
          web({whiteSpace: 'nowrap', cursor: 'pointer'}),
        ]}>
        <Trans context="Indicates a post has been edited">· Edited</Trans>
      </Text>
      <PostEditHistoryDialog
        control={control}
        originalText={originalText}
        currentText={record.text}
        createdAt={record.createdAt}
        updatedAt={updatedAt}
      />
    </>
  )
}

function PostEditHistoryDialog({
  control,
  originalText,
  currentText,
  createdAt,
  updatedAt,
}: {
  control: Dialog.DialogControlProps
  originalText: string | undefined
  currentText: string
  createdAt: string
  updatedAt: string | undefined
}) {
  const {t: l, i18n} = useLingui()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={l`Edit history`}>
        <Dialog.Header>
          <Dialog.HeaderText>
            <Trans>Edit history</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
        <View style={[a.pt_lg]}>
          <TimelineEntry
            isCurrent
            label={
              updatedAt
                ? l`Current · ${i18n.date(new Date(updatedAt), {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}`
                : l`Current`
            }
            text={currentText}
          />
          <TimelineEntry
            isLast
            label={l`Original · ${i18n.date(new Date(createdAt), {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}`}
            text={originalText ?? ''}
          />
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function TimelineEntry({
  label,
  text,
  isCurrent = false,
  isLast = false,
}: {
  label: string
  text: string
  isCurrent?: boolean
  isLast?: boolean
}) {
  const t = useTheme()
  return (
    <View style={[a.flex_row, a.gap_md]}>
      <View style={[a.align_center, {width: 12}]}>
        <View
          style={[
            {width: 12, height: 12, borderRadius: 999, marginTop: 3},
            isCurrent
              ? {backgroundColor: t.palette.primary_500}
              : [{borderWidth: 2}, t.atoms.border_contrast_high, t.atoms.bg],
          ]}
        />
        {!isLast && (
          <View
            style={[
              a.flex_1,
              {width: 2, marginTop: 3, backgroundColor: t.palette.contrast_200},
            ]}
          />
        )}
      </View>
      <View style={[a.flex_1, a.gap_xs, !isLast && a.pb_2xl]}>
        <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
          {label}
        </Text>
        <Text emoji style={[a.text_md, a.leading_normal, t.atoms.text]}>
          {text}
        </Text>
      </View>
    </View>
  )
}
