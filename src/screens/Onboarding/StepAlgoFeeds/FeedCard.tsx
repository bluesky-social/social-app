import React from 'react'
import {View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Image} from 'expo-image'

import {useTheme, atoms as a} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {useFeedSourceInfoQuery, FeedSourceInfo} from '#/state/queries/feed'
import {Text, H3} from '#/components/Typography'
import {Loader} from '#/components/Loader'
import {RichText} from '#/components/RichText'

import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {FeedConfig} from '#/screens/Onboarding/StepAlgoFeeds'

function PrimaryFeedCardInner({
  feed,
  config,
}: {
  feed: FeedSourceInfo
  config: FeedConfig
}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()

  const styles = React.useMemo(
    () => ({
      active: [t.atoms.bg_contrast_50],
      selected: [
        a.shadow_md,
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
        },
      ],
      selectedHover: [
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_50 : t.palette.primary_900,
        },
      ],
      textSelected: [{color: t.palette.white}],
      checkboxSelected: [
        {
          borderColor: t.palette.white,
        },
      ],
    }),
    [t],
  )

  return (
    <View style={[a.w_full, a.py_sm]}>
      <View
        style={[
          a.relative,
          a.w_full,
          a.p_md,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          (ctx.hovered || ctx.focused || ctx.pressed) && styles.active,
          ctx.selected && styles.selected,
          ctx.selected &&
            (ctx.hovered || ctx.focused || ctx.pressed) &&
            styles.selectedHover,
        ]}>
        {ctx.selected && config.gradient && (
          <LinearGradient
            colors={config.gradient.values.map(v => v[1])}
            locations={config.gradient.values.map(v => v[0])}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
        )}

        <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_lg]}>
          <View
            style={[
              {
                width: 64,
                height: 64,
              },
              a.rounded_sm,
              a.overflow_hidden,
              t.atoms.bg,
            ]}>
            <Image
              source={{uri: feed.avatar}}
              style={[a.w_full, a.h_full]}
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={[a.pt_xs, a.flex_grow]}>
            <H3
              style={[
                a.text_lg,
                a.font_bold,
                ctx.selected && styles.textSelected,
              ]}>
              {feed.displayName}
            </H3>

            <Text
              style={[
                {opacity: 0.6},
                a.text_sm,
                a.py_xs,
                ctx.selected && styles.textSelected,
              ]}>
              by @{feed.creatorHandle}
            </Text>
          </View>

          {ctx.selected && (
            <View
              style={[
                {
                  width: 28,
                  height: 28,
                },
                a.justify_center,
                a.align_center,
                a.rounded_sm,
                a.border,
                ctx.selected && styles.checkboxSelected,
              ]}>
              {ctx.selected && <Check size="sm" fill={t.palette.white} />}
            </View>
          )}
        </View>

        <View
          style={[
            {
              opacity: ctx.selected ? 0.3 : 1,
              borderTopWidth: 1,
            },
            a.mt_md,
            a.w_full,
            t.atoms.border,
            ctx.selected && {
              borderTopColor: t.palette.white,
            },
          ]}
        />

        <View style={[a.pt_md]}>
          <RichText
            value={feed.description}
            style={[ctx.selected && t.atoms.text_inverted]}
          />
        </View>
      </View>
    </View>
  )
}

export function PrimaryFeedCard({config}: {config: FeedConfig}) {
  const {data: feed} = useFeedSourceInfoQuery({uri: config.uri})

  return !feed ? (
    <View style={[a.p_xl]}>
      <Loader size="xl" />
    </View>
  ) : (
    <Toggle.Item
      name={feed.uri}
      label={`Subscribe to the ${feed.displayName} feed`}>
      <PrimaryFeedCardInner config={config} feed={feed} />
    </Toggle.Item>
  )
}

function FeedCardInner({feed}: {feed: FeedSourceInfo; config: FeedConfig}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()

  const styles = React.useMemo(
    () => ({
      active: [t.atoms.bg_contrast_50],
      selected: [
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
        },
      ],
      selectedHover: [
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_50 : t.palette.primary_900,
        },
      ],
      textSelected: [],
      checkboxSelected: [
        {
          backgroundColor: t.palette.primary_500,
        },
      ],
    }),
    [t],
  )

  return (
    <View style={[a.w_full, a.py_sm]}>
      <View
        style={[
          a.relative,
          a.w_full,
          a.p_md,
          a.rounded_md,
          a.overflow_hidden,
          t.atoms.bg_contrast_25,
          (ctx.hovered || ctx.focused || ctx.pressed) && styles.active,
          ctx.selected && styles.selected,
          ctx.selected &&
            (ctx.hovered || ctx.focused || ctx.pressed) &&
            styles.selectedHover,
        ]}>
        <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_lg]}>
          <View
            style={[
              {
                width: 44,
                height: 44,
              },
              a.rounded_sm,
              a.overflow_hidden,
              t.atoms.bg,
            ]}>
            <Image
              source={{uri: feed.avatar}}
              style={[a.w_full, a.h_full]}
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={[a.pt_2xs, a.flex_grow]}>
            <H3
              style={[
                a.text_md,
                a.font_bold,
                ctx.selected && styles.textSelected,
              ]}>
              {feed.displayName}
            </H3>
            <Text
              style={[
                {opacity: 0.8},
                a.pt_xs,
                ctx.selected && styles.textSelected,
              ]}>
              @{feed.creatorHandle}
            </Text>
          </View>

          <View
            style={[
              a.justify_center,
              a.align_center,
              a.rounded_sm,
              t.atoms.bg_contrast_25,
              ctx.selected && styles.checkboxSelected,
              {
                width: 28,
                height: 28,
              },
            ]}>
            {ctx.selected && <Check size="sm" fill={t.palette.white} />}
          </View>
        </View>

        <View
          style={[
            {
              opacity: ctx.selected ? 0.3 : 1,
              borderTopWidth: 1,
            },
            a.mt_md,
            a.w_full,
            t.atoms.border,
            ctx.selected && {
              borderTopColor: t.palette.primary_200,
            },
          ]}
        />

        <View style={[a.pt_md]}>
          <RichText value={feed.description} />
        </View>
      </View>
    </View>
  )
}

export function FeedCard({config}: {config: FeedConfig}) {
  const {data: feed} = useFeedSourceInfoQuery({uri: config.uri})

  return !feed ? (
    <View style={[a.p_xl]}>
      <Loader size="xl" />
    </View>
  ) : (
    <Toggle.Item
      name={feed.uri}
      label={`Subscribe to the ${feed.displayName} feed`}>
      <FeedCardInner config={config} feed={feed} />
    </Toggle.Item>
  )
}
