import React from 'react'
import {View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import {useTheme, atoms as a, tokens} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {useFeedSourceInfoQuery, FeedSourceInfo} from '#/state/queries/feed'
import {Text, H3, P} from '#/components/Typography'
import {Loader} from '#/components/Loader'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'

type FeedConfig = {
  uri: string
  description: string
  gradient: typeof tokens.gradients.sky | typeof tokens.gradients.sunrise
}

const PRIMARY_FEEDS: FeedConfig[] = [
  {
    uri: 'at://did:plc:wqowuobffl66jv3kpsvo7ak4/app.bsky.feed.generator/the-algorithm',
    description: ``,
    gradient: tokens.gradients.sunrise,
  },
  {
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
    description: ``,
    gradient: tokens.gradients.sky,
  },
]

function PrimaryFeedButtonInner({
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
        {ctx.selected && (
          <LinearGradient
            colors={
              ctx.hovered || ctx.pressed || ctx.focused
                ? config.gradient.values.map(() => config.gradient.hover_value)
                : config.gradient.values.map(v => v[1])
            }
            locations={config.gradient.values.map(v => v[0])}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[a.absolute, a.inset_0]}
          />
        )}

        <View style={[a.flex_row, a.gap_lg]}>
          <View
            style={[
              {
                width: 64,
                height: 64,
              },
              a.rounded_sm,
              t.atoms.bg,
            ]}
          />

          <View style={[a.pt_xs]}>
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
                {opacity: 0.8},
                a.pt_xs,
                ctx.selected && styles.textSelected,
              ]}>
              @{feed.creatorHandle}
            </Text>
            <P>{config.description}</P>
          </View>
        </View>
      </View>
    </View>
  )
}

function PrimaryFeedButton({config}: {config: FeedConfig}) {
  const {data: feed} = useFeedSourceInfoQuery({uri: config.uri})

  return !feed ? (
    <View style={[a.p_xl]}>
      <Loader size="xl" />
    </View>
  ) : (
    <Toggle.Item
      name={feed.uri}
      label={`Subscribe to the ${feed.displayName} feed`}>
      <PrimaryFeedButtonInner config={config} feed={feed} />
    </Toggle.Item>
  )
}

export function StepAlgoFeeds() {
  const t = useTheme()
  const {state, dispatch} = React.useContext(Context)
  const [primaryFeedUris, setPrimaryFeedUris] = React.useState<string[]>([])
  // const [secondaryFeedUris, setSeconaryFeedUris] = React.useState<string[]>([])

  return (
    <View style={[a.align_start]}>
      <Title>Choose your algorithmic feeds</Title>
      <Description>
        Feeds are created by users and can give you entirely new experiences.
        Bluesky features two main "algorithmic feeds" at the moment.
      </Description>

      <View style={[a.w_full, a.pt_2xl]}>
        <Toggle.Group
          values={primaryFeedUris}
          onChange={setPrimaryFeedUris}
          label="Select your primary algorithmic feeds">
          {PRIMARY_FEEDS.map(config => (
            <PrimaryFeedButton key={config.uri} config={config} />
          ))}
        </Toggle.Group>
      </View>

      <View style={[{borderTopWidth: 1}, a.w_full, t.atoms.border]} />

      <OnboardingControls.Portal>
        <Button
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={() => dispatch({type: 'next'})}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
