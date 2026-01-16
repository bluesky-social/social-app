import {useCallback, useEffect, useImperativeHandle, useMemo} from 'react'
import {findNodeHandle, type ListRenderItemInfo, View} from 'react-native'
import {
  type AppBskyLabelerDefs,
  type InterpretedLabelValueDefinition,
  interpretLabelValueDefinitions,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isLabelerSubscribed, lookupLabelValueDefinition} from '#/lib/moderation'
import {List, type ListRef} from '#/view/com/util/List'
import {atoms as a, ios, tokens, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {ListFooter} from '#/components/Lists'
import {Loader} from '#/components/Loader'
import {LabelerLabelPreference} from '#/components/moderation/LabelPreference'
import {Text} from '#/components/Typography'
import {IS_IOS, IS_NATIVE} from '#/env'
import {ErrorState} from '../ErrorState'
import {type SectionRef} from './types'

interface LabelsSectionProps {
  ref: React.Ref<SectionRef>
  isLabelerLoading: boolean
  labelerInfo: AppBskyLabelerDefs.LabelerViewDetailed | undefined
  labelerError: Error | null
  moderationOpts: ModerationOpts
  scrollElRef: ListRef
  headerHeight: number
  isFocused: boolean
  setScrollViewTag: (tag: number | null) => void
}

export function ProfileLabelsSection({
  ref,
  isLabelerLoading,
  labelerInfo,
  labelerError,
  moderationOpts,
  scrollElRef,
  headerHeight,
  isFocused,
  setScrollViewTag,
}: LabelsSectionProps) {
  const t = useTheme()

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerHeight,
    })
  }, [scrollElRef, headerHeight])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  useEffect(() => {
    if (IS_IOS && isFocused && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  const isSubscribed = labelerInfo
    ? !!isLabelerSubscribed(labelerInfo, moderationOpts)
    : false

  const labelValues = useMemo(() => {
    if (isLabelerLoading || !labelerInfo || labelerError) return []
    const customDefs = interpretLabelValueDefinitions(labelerInfo)
    return labelerInfo.policies.labelValues
      .filter((val, i, arr) => arr.indexOf(val) === i) // dedupe
      .map(val => lookupLabelValueDefinition(val, customDefs))
      .filter(
        def => def && def?.configurable,
      ) as InterpretedLabelValueDefinition[]
  }, [labelerInfo, labelerError, isLabelerLoading])

  const numItems = labelValues.length

  const renderItem = useCallback(
    ({item, index}: ListRenderItemInfo<InterpretedLabelValueDefinition>) => {
      if (!labelerInfo) return null
      return (
        <View
          style={[
            t.atoms.bg_contrast_25,
            index === 0 && [
              a.overflow_hidden,
              {
                borderTopLeftRadius: tokens.borderRadius.md,
                borderTopRightRadius: tokens.borderRadius.md,
              },
            ],
            index === numItems - 1 && [
              a.overflow_hidden,
              {
                borderBottomLeftRadius: tokens.borderRadius.md,
                borderBottomRightRadius: tokens.borderRadius.md,
              },
            ],
          ]}>
          {index !== 0 && <Divider />}
          <LabelerLabelPreference
            disabled={isSubscribed ? undefined : true}
            labelDefinition={item}
            labelerDid={labelerInfo.creator.did}
          />
        </View>
      )
    },
    [labelerInfo, isSubscribed, numItems, t],
  )

  return (
    <View>
      <List
        ref={scrollElRef}
        data={labelValues}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={a.px_xl}
        headerOffset={headerHeight}
        progressViewOffset={ios(0)}
        ListHeaderComponent={
          <LabelerListHeader
            isLabelerLoading={isLabelerLoading}
            labelerInfo={labelerInfo}
            labelerError={labelerError}
            hasValues={labelValues.length !== 0}
            isSubscribed={isSubscribed}
          />
        }
        ListFooterComponent={
          <ListFooter
            height={headerHeight + 180}
            style={a.border_transparent}
          />
        }
      />
    </View>
  )
}

function keyExtractor(item: InterpretedLabelValueDefinition) {
  return item.identifier
}

export function LabelerListHeader({
  isLabelerLoading,
  labelerError,
  labelerInfo,
  hasValues,
  isSubscribed,
}: {
  isLabelerLoading: boolean
  labelerError?: Error | null
  labelerInfo?: AppBskyLabelerDefs.LabelerViewDetailed
  hasValues: boolean
  isSubscribed: boolean
}) {
  const t = useTheme()
  const {_} = useLingui()

  if (isLabelerLoading) {
    return (
      <View style={[a.w_full, a.align_center, a.py_4xl]}>
        <Loader size="xl" />
      </View>
    )
  }

  if (labelerError || !labelerInfo) {
    return (
      <View style={[a.w_full, a.align_center, a.py_4xl]}>
        <ErrorState
          error={
            labelerError?.toString() ||
            _(msg`Something went wrong, please try again.`)
          }
        />
      </View>
    )
  }

  return (
    <View style={[a.py_xl]}>
      <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
        <Trans>
          Labels are annotations on users and content. They can be used to hide,
          warn, and categorize the network.
        </Trans>
      </Text>
      {labelerInfo?.creator.viewer?.blocking ? (
        <View style={[a.flex_row, a.gap_sm, a.align_center, a.mt_md]}>
          <CircleInfo size="sm" fill={t.atoms.text_contrast_medium.color} />
          <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
            <Trans>
              Blocking does not prevent this labeler from placing labels on your
              account.
            </Trans>
          </Text>
        </View>
      ) : null}
      {!hasValues ? (
        <Text
          style={[
            a.pt_xl,
            t.atoms.text_contrast_high,
            a.leading_snug,
            a.text_sm,
          ]}>
          <Trans>
            This labeler hasn't declared what labels it publishes, and may not
            be active.
          </Trans>
        </Text>
      ) : !isSubscribed ? (
        <Text
          style={[
            a.pt_xl,
            t.atoms.text_contrast_high,
            a.leading_snug,
            a.text_sm,
          ]}>
          <Trans>
            Subscribe to @{labelerInfo.creator.handle} to use these labels:
          </Trans>
        </Text>
      ) : null}
    </View>
  )
}
