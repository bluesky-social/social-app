import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a, tokens, useBreakpoints, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'
import {ListSparkle_Stroke2_Corner0_Rounded as ListSparkle} from '#/components/icons/ListSparkle'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {
  FeedCard,
  PrimaryFeedCard,
} from '#/screens/Onboarding/StepAlgoFeeds/FeedCard'

export type FeedConfig = {
  default: boolean
  uri: string
  gradient?: typeof tokens.gradients.midnight | typeof tokens.gradients.summer
}

const PRIMARY_FEEDS: FeedConfig[] = [
  {
    default: true,
    uri: 'at://did:plc:wqowuobffl66jv3kpsvo7ak4/app.bsky.feed.generator/the-algorithm',
    gradient: tokens.gradients.summer,
  },
  {
    default: false,
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
    gradient: tokens.gradients.midnight,
  },
]

const SECONDARY_FEEDS: FeedConfig[] = [
  {
    default: false,
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends',
  },
  {
    default: false,
    uri: 'at://did:plc:vpkhqolt662uhesyj6nxm7ys/app.bsky.feed.generator/infreq',
  },
  {
    default: false,
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/best-of-follows',
  },
]

export function StepAlgoFeeds() {
  const {_} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {state, dispatch} = React.useContext(Context)
  const [primaryFeedUris, setPrimaryFeedUris] = React.useState<string[]>(
    PRIMARY_FEEDS.map(f => (f.default ? f.uri : '')).filter(Boolean),
  )
  const [secondaryFeedUris, setSeconaryFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  const saveFeeds = React.useCallback(async () => {
    setSaving(true)

    const uris = primaryFeedUris.concat(secondaryFeedUris)
    dispatch({type: 'setAlgoFeedsStepResults', feedUris: uris})

    await new Promise(y => setTimeout(y, 1000))

    setSaving(false)
    dispatch({type: 'next'})
  }, [primaryFeedUris, secondaryFeedUris, dispatch])

  return (
    <View style={[a.align_start, {paddingTop: gtMobile ? 100 : 60}]}>
      <View
        style={[
          a.p_lg,
          a.mb_3xl,
          a.rounded_full,
          {
            backgroundColor:
              t.name === 'light' ? t.palette.primary_25 : t.palette.primary_975,
          },
        ]}>
        <ListSparkle size="xl" fill={t.palette.primary_500} />
      </View>

      <Title>
        <Trans>Choose your algorithmic feeds</Trans>
      </Title>
      <Description style={[a.pb_md]}>
        <Trans>
          Feeds are created by users and can give you entirely new experiences.
          At Bluesky, you get to choose your algorithm.
        </Trans>
      </Description>
      <Description>
        <Trans>
          We recommend selecting one primary algorithmic feed and as many
          secondary algorithmic feeds as you like.
        </Trans>
      </Description>

      <Text style={[a.font_bold, a.pt_3xl, a.pb_md, t.atoms.text_contrast_400]}>
        <Trans>Primary algorithmic feeds</Trans>
      </Text>

      <View style={[a.w_full, a.pb_2xl]}>
        <Toggle.Group
          values={primaryFeedUris}
          onChange={setPrimaryFeedUris}
          label={_(msg`Select your primary algorithmic feeds`)}>
          <View style={[a.gap_md]}>
            {PRIMARY_FEEDS.map(config => (
              <PrimaryFeedCard key={config.uri} config={config} />
            ))}
          </View>
        </Toggle.Group>
      </View>

      <Divider />

      <Text style={[a.font_bold, a.pt_3xl, a.pb_md, t.atoms.text_contrast_400]}>
        <Trans>Secondary algorithmic feeds</Trans>
      </Text>

      <View style={[a.w_full, a.pb_2xl]}>
        <Toggle.Group
          values={secondaryFeedUris}
          onChange={setSeconaryFeedUris}
          label={_(msg`Select your secondary algorithmic feeds`)}>
          <View style={[a.gap_md]}>
            {SECONDARY_FEEDS.map(config => (
              <FeedCard key={config.uri} config={config} />
            ))}
          </View>
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving || primaryFeedUris.length === 0}
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label={_(msg`Continue to the next step`)}
          onPress={saveFeeds}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
