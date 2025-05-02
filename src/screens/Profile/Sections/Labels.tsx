import React from 'react'
import {findNodeHandle, View} from 'react-native'
import type Animated from 'react-native-reanimated'
import {useSafeAreaFrame} from 'react-native-safe-area-context'
import {
  type AppBskyLabelerDefs,
  type InterpretedLabelValueDefinition,
  interpretLabelValueDefinitions,
  type ModerationOpts,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useAnimatedScrollHandler} from '#/lib/hooks/useAnimatedScrollHandler_FIXED'
import {isLabelerSubscribed, lookupLabelValueDefinition} from '#/lib/moderation'
import {useScrollHandlers} from '#/lib/ScrollContext'
import {isIOS, isNative} from '#/platform/detection'
import {type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {LabelerLabelPreference} from '#/components/moderation/LabelPreference'
import {Text} from '#/components/Typography'
import {ErrorState} from '../ErrorState'
import {type SectionRef} from './types'

interface LabelsSectionProps {
  isLabelerLoading: boolean
  labelerInfo: AppBskyLabelerDefs.LabelerViewDetailed | undefined
  labelerError: Error | null
  moderationOpts: ModerationOpts
  scrollElRef: ListRef
  headerHeight: number
  isFocused: boolean
  setScrollViewTag: (tag: number | null) => void
}
export const ProfileLabelsSection = React.forwardRef<
  SectionRef,
  LabelsSectionProps
>(function LabelsSectionImpl(
  {
    isLabelerLoading,
    labelerInfo,
    labelerError,
    moderationOpts,
    scrollElRef,
    headerHeight,
    isFocused,
    setScrollViewTag,
  },
  ref,
) {
  const {_} = useLingui()
  const {height: minHeight} = useSafeAreaFrame()

  // Intentionally destructured outside the main thread closure.
  // See https://github.com/bluesky-social/social-app/pull/4108.
  const {
    onBeginDrag: onBeginDragFromContext,
    onEndDrag: onEndDragFromContext,
    onScroll: onScrollFromContext,
    onMomentumEnd: onMomentumEndFromContext,
  } = useScrollHandlers()
  const scrollHandler = useAnimatedScrollHandler({
    onBeginDrag(e, ctx) {
      onBeginDragFromContext?.(e, ctx)
    },
    onEndDrag(e, ctx) {
      onEndDragFromContext?.(e, ctx)
    },
    onScroll(e, ctx) {
      onScrollFromContext?.(e, ctx)
    },
    onMomentumEnd(e, ctx) {
      onMomentumEndFromContext?.(e, ctx)
    },
  })

  const onScrollToTop = React.useCallback(() => {
    // @ts-ignore TODO fix this
    scrollElRef.current?.scrollTo({
      animated: isNative,
      x: 0,
      y: -headerHeight,
    })
  }, [scrollElRef, headerHeight])

  React.useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  React.useEffect(() => {
    if (isIOS && isFocused && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  return (
    <Layout.Center style={{minHeight}}>
      <Layout.Content
        ref={scrollElRef as React.Ref<Animated.ScrollView>}
        scrollEventThrottle={1}
        contentContainerStyle={{
          paddingTop: headerHeight,
          borderWidth: 0,
        }}
        contentOffset={{x: 0, y: headerHeight * -1}}
        onScroll={scrollHandler}>
        {isLabelerLoading ? (
          <View style={[a.w_full, a.align_center, a.py_4xl]}>
            <Loader size="xl" />
          </View>
        ) : labelerError || !labelerInfo ? (
          <View style={[a.w_full, a.align_center, a.py_4xl]}>
            <ErrorState
              error={
                labelerError?.toString() ||
                _(msg`Something went wrong, please try again.`)
              }
            />
          </View>
        ) : (
          <ProfileLabelsSectionInner
            moderationOpts={moderationOpts}
            labelerInfo={labelerInfo}
          />
        )}
      </Layout.Content>
    </Layout.Center>
  )
})

export function ProfileLabelsSectionInner({
  moderationOpts,
  labelerInfo,
}: {
  moderationOpts: ModerationOpts
  labelerInfo: AppBskyLabelerDefs.LabelerViewDetailed
}) {
  const t = useTheme()

  const {labelValues} = labelerInfo.policies
  const isSubscribed = isLabelerSubscribed(labelerInfo, moderationOpts)
  const labelDefs = React.useMemo(() => {
    const customDefs = interpretLabelValueDefinitions(labelerInfo)
    return labelValues
      .map(val => lookupLabelValueDefinition(val, customDefs))
      .filter(
        def => def && def?.configurable,
      ) as InterpretedLabelValueDefinition[]
  }, [labelerInfo, labelValues])

  return (
    <View style={[a.pt_xl, a.px_lg, a.border_t, t.atoms.border_contrast_low]}>
      <View>
        <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
          <Trans>
            Labels are annotations on users and content. They can be used to
            hide, warn, and categorize the network.
          </Trans>
        </Text>
        {labelerInfo.creator.viewer?.blocking ? (
          <View style={[a.flex_row, a.gap_sm, a.align_center, a.mt_md]}>
            <CircleInfo size="sm" fill={t.atoms.text_contrast_medium.color} />
            <Text
              style={[t.atoms.text_contrast_high, a.leading_snug, a.text_sm]}>
              <Trans>
                Blocking does not prevent this labeler from placing labels on
                your account.
              </Trans>
            </Text>
          </View>
        ) : null}
        {labelValues.length === 0 ? (
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
      {labelDefs.length > 0 && (
        <View
          style={[
            a.mt_xl,
            a.w_full,
            a.rounded_md,
            a.overflow_hidden,
            t.atoms.bg_contrast_25,
          ]}>
          {labelDefs.map((labelDef, i) => {
            return (
              <React.Fragment key={labelDef.identifier}>
                {i !== 0 && <Divider />}
                <LabelerLabelPreference
                  disabled={isSubscribed ? undefined : true}
                  labelDefinition={labelDef}
                  labelerDid={labelerInfo.creator.did}
                />
              </React.Fragment>
            )
          })}
        </View>
      )}
    </View>
  )
}
