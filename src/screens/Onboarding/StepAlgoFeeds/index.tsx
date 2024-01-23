import React from 'react'
import {View} from 'react-native'

import {usePinFeedMutation} from '#/state/queries/preferences'

import {atoms as a, tokens} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'

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
  const {state, dispatch} = React.useContext(Context)
  const [primaryFeedUris, setPrimaryFeedUris] = React.useState<string[]>(
    PRIMARY_FEEDS.map(f => (f.default ? f.uri : '')).filter(Boolean),
  )
  const [secondaryFeedUris, setSeconaryFeedUris] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const {mutateAsync: pinFeed} = usePinFeedMutation()

  const saveFeeds = React.useCallback(async () => {
    setSaving(true)

    const uris = primaryFeedUris.concat(secondaryFeedUris)

    for (const uri of uris) {
      try {
        await pinFeed({uri})
      } catch (e) {
        // TODO not critical here?
      }
    }

    setSaving(false)
    dispatch({type: 'next'})
  }, [primaryFeedUris, secondaryFeedUris, dispatch, pinFeed])

  return (
    <View style={[a.align_start]}>
      <Title>Choose your algorithmic feeds</Title>
      <Description>
        Feeds are created by users and can give you entirely new experiences.
      </Description>

      <Text style={[a.font_bold, a.pt_2xl, a.pb_sm]}>
        Select at least one primary algorithmic feed:
      </Text>

      <View style={[a.w_full, a.pb_2xl]}>
        <Toggle.Group
          values={primaryFeedUris}
          onChange={setPrimaryFeedUris}
          label="Select your primary algorithmic feeds">
          {PRIMARY_FEEDS.map(config => (
            <PrimaryFeedCard key={config.uri} config={config} />
          ))}
        </Toggle.Group>
      </View>

      <Divider />

      <Text style={[a.font_bold, a.pt_2xl, a.pb_sm]}>
        And select as many secondary algorithmic feeds as you like:
      </Text>

      <View style={[a.w_full, a.pb_2xl]}>
        <Toggle.Group
          values={secondaryFeedUris}
          onChange={setSeconaryFeedUris}
          label="Select your secondary algorithmic feeds">
          {SECONDARY_FEEDS.map(config => (
            <FeedCard key={config.uri} config={config} />
          ))}
        </Toggle.Group>
      </View>

      <OnboardingControls.Portal>
        <Button
          disabled={saving || primaryFeedUris.length === 0}
          key={state.activeStep} // remove focus state on nav
          variant="gradient"
          color="gradient_sky"
          size="large"
          label="Continue setting up your account"
          onPress={saveFeeds}>
          <ButtonText>Continue</ButtonText>
          <ButtonIcon icon={saving ? Loader : ChevronRight} />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
