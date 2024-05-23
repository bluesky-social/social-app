import React from 'react'
import {View} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {FeedSourceInfo, useFeedSourceInfoQuery} from '#/state/queries/feed'
import {FeedConfig} from '#/screens/Onboarding/StepAlgoFeeds'
import {atoms as a, useTheme} from '#/alf'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {RichText} from '#/components/RichText'
import {Text} from '#/components/Typography'

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
      active: [t.atoms.bg_contrast_25],
      selected: [
        a.shadow_md,
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_50 : t.palette.primary_950,
        },
      ],
      selectedHover: [
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
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
    <View
      style={[
        a.relative,
        a.w_full,
        a.p_lg,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg_contrast_50,
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
          <Text
            style={[
              a.text_lg,
              a.font_bold,
              ctx.selected && styles.textSelected,
            ]}>
            {feed.displayName}
          </Text>

          <Text
            style={[
              {opacity: 0.6},
              a.text_md,
              a.py_xs,
              ctx.selected && styles.textSelected,
            ]}>
            <Trans>by @{feed.creatorHandle}</Trans>
          </Text>
        </View>

        <View
          style={[
            {
              width: 28,
              height: 28,
            },
            a.justify_center,
            a.align_center,
            a.rounded_sm,
            ctx.selected ? [a.border, styles.checkboxSelected] : t.atoms.bg,
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
          t.atoms.border_contrast_low,
          ctx.selected && {
            borderTopColor: t.palette.white,
          },
        ]}
      />

      <View style={[a.pt_md]}>
        <RichText
          value={feed.description}
          style={[
            a.text_md,
            ctx.selected &&
              (t.name === 'light'
                ? t.atoms.text_inverted
                : {color: t.palette.white}),
          ]}
          disableLinks
        />
      </View>
    </View>
  )
}

export function PrimaryFeedCard({config}: {config: FeedConfig}) {
  const {_} = useLingui()
  const {data: feed} = useFeedSourceInfoQuery({uri: config.uri})

  return !feed ? (
    <FeedCardPlaceholder primary />
  ) : (
    <Toggle.Item
      name={feed.uri}
      label={_(msg`Subscribe to the ${feed.displayName} feed`)}>
      <PrimaryFeedCardInner config={config} feed={feed} />
    </Toggle.Item>
  )
}

function FeedCardInner({feed}: {feed: FeedSourceInfo; config: FeedConfig}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()

  const styles = React.useMemo(
    () => ({
      active: [t.atoms.bg_contrast_25],
      selected: [
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_50 : t.palette.primary_950,
        },
      ],
      selectedHover: [
        {
          backgroundColor:
            t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
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
    <View
      style={[
        a.relative,
        a.w_full,
        a.p_md,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg_contrast_50,
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

        <View style={[a.pt_2xs, a.flex_1, a.flex_grow]}>
          <Text
            style={[
              a.text_md,
              a.font_bold,
              ctx.selected && styles.textSelected,
            ]}
            numberOfLines={1}>
            {feed.displayName}
          </Text>
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
            t.atoms.bg,
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
          t.atoms.border_contrast_low,
          ctx.selected && {
            borderTopColor: t.palette.primary_200,
          },
        ]}
      />

      <View style={[a.pt_md]}>
        <RichText value={feed.description} disableLinks />
      </View>
    </View>
  )
}

export function FeedCard({config}: {config: FeedConfig}) {
  const {_} = useLingui()
  const {data: feed} = useFeedSourceInfoQuery({uri: config.uri})

  return !feed ? (
    <FeedCardPlaceholder />
  ) : feed.avatar ? (
    <Toggle.Item
      name={feed.uri}
      label={_(msg`Subscribe to the ${feed.displayName} feed`)}>
      <FeedCardInner config={config} feed={feed} />
    </Toggle.Item>
  ) : null
}

export function FeedCardPlaceholder({primary}: {primary?: boolean}) {
  const t = useTheme()
  return (
    <View
      style={[
        a.relative,
        a.w_full,
        a.p_md,
        a.rounded_md,
        a.overflow_hidden,
        t.atoms.bg_contrast_25,
      ]}>
      <View style={[a.flex_row, a.align_center, a.justify_between, a.gap_lg]}>
        <View
          style={[
            {
              width: primary ? 64 : 44,
              height: primary ? 64 : 44,
            },
            a.rounded_sm,
            a.overflow_hidden,
            t.atoms.bg_contrast_100,
          ]}
        />

        <View style={[a.pt_2xs, a.flex_grow, a.gap_sm]}>
          <View
            style={[
              {width: 100, height: primary ? 20 : 16},
              a.rounded_sm,
              t.atoms.bg_contrast_100,
            ]}
          />
          <View
            style={[
              {width: 60, height: 12},
              a.rounded_sm,
              t.atoms.bg_contrast_100,
            ]}
          />
        </View>
      </View>

      <View
        style={[
          {
            borderTopWidth: 1,
          },
          a.mt_md,
          a.w_full,
          t.atoms.border_contrast_low,
        ]}
      />

      <View style={[a.pt_md, a.gap_xs]}>
        <View
          style={[
            {width: '60%', height: 12},
            a.rounded_sm,
            t.atoms.bg_contrast_100,
          ]}
        />
      </View>
    </View>
  )
}
