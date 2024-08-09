import React from 'react'
import {StyleProp, View, ViewStyle} from 'react-native'
import {AppBskyFeedPostgate} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import isEqual from 'lodash.isequal'

import {useMyListsQuery} from '#/state/queries/my-lists'
import {
  createPostgateRecord,
  embeddingRules,
} from '#/state/queries/postgate/util'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = {
  onSave: () => void
  isSaving: boolean

  postgate: AppBskyFeedPostgate.Record
  onChangePostgate: (v: AppBskyFeedPostgate.Record) => void

  threadgateAllowUISettings: ThreadgateAllowUISetting[]
  onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void
}

export function PostInteractionSettingsDialog({
  control,
  ...rest
}: Props & {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogContent {...rest} />
    </Dialog.Outer>
  )
}

function DialogContent({
  onSave,
  isSaving,
  postgate,
  onChangePostgate,
  threadgateAllowUISettings,
  onChangeThreadgateAllowUISettings,
}: Props) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const {data: lists} = useMyListsQuery('curate')

  const onPressAudience = (setting: ThreadgateAllowUISetting) => {
    // remove boolean values
    let newSelected: ThreadgateAllowUISetting[] =
      threadgateAllowUISettings.filter(
        v => v.type !== 'nobody' && v.type !== 'everybody',
      )
    // toggle
    const i = newSelected.findIndex(v => isEqual(v, setting))
    if (i === -1) {
      newSelected.push(setting)
    } else {
      newSelected.splice(i, 1)
    }

    onChangeThreadgateAllowUISettings(newSelected)
  }

  const onChangeEmbeddingRules = React.useCallback(
    (rules: AppBskyFeedPostgate.Record['quotepostRules']) => {
      onChangePostgate(
        createPostgateRecord({
          ...postgate,
          quotepostRules: rules,
        }),
      )
    },
    [postgate, onChangePostgate],
  )

  const doneLabel = _(msg`Save`)
  return (
    <Dialog.ScrollableInner
      label={_(msg`Edit post interaction settings`)}
      style={[{maxWidth: 500}, a.w_full]}>
      <View style={[a.flex_1, a.gap_md]}>
        <Text style={[a.text_2xl, a.font_bold]}>
          <Trans>Post interaction settings</Trans>
        </Text>

        <View style={[a.gap_lg]}>
          <Text style={[a.text_md]}>
            <Trans>Customize who can engage with this post.</Trans>
          </Text>

          <Divider />

          <View style={[a.gap_sm]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Quote settings</Trans>
            </Text>

            <Text style={[a.pt_sm, t.atoms.text_contrast_medium]}>
              <Trans>Allow quote posts from:</Trans>
            </Text>

            <View style={[a.flex_row, a.gap_sm]}>
              <Selectable
                label={_(msg`Everybody`)}
                isSelected={
                  !postgate.quotepostRules ||
                  postgate.quotepostRules?.length === 0
                }
                onPress={() => onChangeEmbeddingRules([])}
                style={{flex: 1}}
              />
              <Selectable
                label={_(msg`Nobody`)}
                isSelected={Boolean(
                  postgate.quotepostRules &&
                    postgate.quotepostRules.find(
                      v => v.$type === embeddingRules.disableRule.$type,
                    ),
                )}
                onPress={() =>
                  onChangeEmbeddingRules([embeddingRules.disableRule])
                }
                style={{flex: 1}}
              />
            </View>
          </View>

          <Divider />

          <View style={[a.gap_sm]}>
            <Text style={[a.font_bold, a.text_lg]}>
              <Trans>Reply settings</Trans>
            </Text>

            <Text style={[a.pt_sm, t.atoms.text_contrast_medium]}>
              <Trans>Allow replies from:</Trans>
            </Text>

            <View style={[a.flex_row, a.gap_sm]}>
              <Selectable
                label={_(msg`Everybody`)}
                isSelected={
                  !!threadgateAllowUISettings.find(v => v.type === 'everybody')
                }
                onPress={() =>
                  onChangeThreadgateAllowUISettings([{type: 'everybody'}])
                }
                style={{flex: 1}}
              />
              <Selectable
                label={_(msg`Nobody`)}
                isSelected={
                  !!threadgateAllowUISettings.find(v => v.type === 'nobody')
                }
                onPress={() =>
                  onChangeThreadgateAllowUISettings([{type: 'nobody'}])
                }
                style={{flex: 1}}
              />
            </View>

            <Text style={[a.pt_sm, t.atoms.text_contrast_medium]}>
              <Trans>Or combine these options:</Trans>
            </Text>

            <View style={[a.gap_sm]}>
              <Selectable
                label={_(msg`Mentioned users`)}
                isSelected={
                  !!threadgateAllowUISettings.find(v => v.type === 'mention')
                }
                onPress={() => onPressAudience({type: 'mention'})}
              />
              <Selectable
                label={_(msg`Followed users`)}
                isSelected={
                  !!threadgateAllowUISettings.find(v => v.type === 'following')
                }
                onPress={() => onPressAudience({type: 'following'})}
              />
              {lists && lists.length > 0
                ? lists.map(list => (
                    <Selectable
                      key={list.uri}
                      label={_(msg`Users in "${list.name}"`)}
                      isSelected={
                        !!threadgateAllowUISettings.find(
                          v => v.type === 'list' && v.list === list.uri,
                        )
                      }
                      onPress={() =>
                        onPressAudience({type: 'list', list: list.uri})
                      }
                    />
                  ))
                : // No loading states to avoid jumps for the common case (no lists)
                  null}
            </View>
          </View>
        </View>
      </View>

      <Button
        label={doneLabel}
        onPress={onSave}
        onAccessibilityEscape={control.close}
        color="primary"
        size="medium"
        variant="solid"
        style={a.mt_xl}>
        <ButtonText>{doneLabel}</ButtonText>
        {isSaving && <ButtonIcon icon={Loader} position="right" />}
      </Button>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function Selectable({
  label,
  isSelected,
  onPress,
  style,
}: {
  label: string
  isSelected: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  return (
    <Button
      onPress={onPress}
      label={label}
      accessibilityHint="Select this option"
      accessibilityRole="checkbox"
      aria-checked={isSelected}
      accessibilityState={{
        checked: isSelected,
      }}
      style={a.flex_1}>
      {({hovered, focused}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,
            a.align_center,
            a.justify_between,
            a.rounded_sm,
            a.p_md,
            {height: 40}, // for consistency with checkmark icon visible or not
            t.atoms.bg_contrast_50,
            (hovered || focused) && t.atoms.bg_contrast_100,
            isSelected && {
              backgroundColor: t.palette.primary_100,
            },
            style,
          ]}>
          <Text style={[a.text_sm, isSelected && a.font_semibold]}>
            {label}
          </Text>
          {isSelected ? (
            <Check size="sm" fill={t.palette.primary_500} />
          ) : (
            <View />
          )}
        </View>
      )}
    </Button>
  )
}
