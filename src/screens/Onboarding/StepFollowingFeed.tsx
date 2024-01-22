import React from 'react'
import {View} from 'react-native'

import {atoms as a, useTheme} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Toggle from '#/components/forms/Toggle'

import {Context} from '#/screens/Onboarding/state'
import {
  Title,
  Description,
  OnboardingControls,
} from '#/screens/Onboarding/Layout'
import {
  usePreferencesQuery,
  useSetFeedViewPreferencesMutation,
} from 'state/queries/preferences'
import {H5, Text} from '#/components/Typography'

export function StepFollowingFeed() {
  const t = useTheme()

  const {state, dispatch} = React.useContext(Context)

  const {data: preferences} = usePreferencesQuery()
  const {mutate: setFeedViewPref, variables} =
    useSetFeedViewPreferencesMutation()

  const showReplies = !(
    variables?.hideReplies ?? preferences?.feedViewPrefs.hideReplies
  )
  const showReposts = !(
    variables?.hideReposts ?? preferences?.feedViewPrefs.hideReposts
  )
  const showQuotes = !(
    variables?.hideQuotePosts ?? preferences?.feedViewPrefs.hideQuotePosts
  )

  return (
    // Hack for now to move the image container up
    <View style={[a.align_start, {marginTop: -80}]}>
      <View style={[a.w_full, a.gap_sm, a.mb_xl]}>
        <HeaderListItem>Newest</HeaderListItem>
        <HeaderListItem />
        <HeaderListItem>Oldest</HeaderListItem>
      </View>

      <Title>Your default feed is "Following"</Title>
      <Description style={[a.mb_xl]}>
        It only show posts from the people your follow, in the order they were
        posted.
      </Description>

      <View style={[a.gap_lg, a.w_full]}>
        <View
          style={{borderTopWidth: 1, borderTopColor: t.palette.contrast_100}}
        />
        <Toggle.Item
          name="Show Replies"
          label="Show replies in Following"
          value={showReplies}
          onChange={v => {
            setFeedViewPref({
              hideReplies: !v,
            })
          }}>
          <View
            style={[a.flex_row, a.w_full, a.justify_between, a.align_center]}>
            <Text style={[a.text_md, a.font_bold]}>
              Show replies in Following
            </Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
        <View
          style={{borderTopWidth: 1, borderTopColor: t.palette.contrast_100}}
        />
        <Toggle.Item
          name="Show Reposts"
          label="Show reposts in Following"
          value={showReposts}
          onChange={v => {
            setFeedViewPref({
              hideReposts: !v,
            })
          }}>
          <View
            style={[a.flex_row, a.w_full, a.justify_between, a.align_center]}>
            <Text style={[a.text_md, a.font_bold]}>
              Show reposts in Following
            </Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
        <View
          style={{borderTopWidth: 1, borderTopColor: t.palette.contrast_100}}
        />
        <Toggle.Item
          name="Show Quotes"
          label="Show quotes in Following"
          value={showQuotes}
          onChange={v => {
            setFeedViewPref({
              hideQuotePosts: !v,
            })
          }}>
          <View
            style={[a.flex_row, a.w_full, a.justify_between, a.align_center]}>
            <Text style={[a.text_md, a.font_bold]}>
              Show quotes in Following
            </Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
        <View
          style={{borderTopWidth: 1, borderTopColor: t.palette.contrast_100}}
        />
      </View>

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

// Just a placeholder for now, if you use an image instead
function HeaderListItem({children}: React.PropsWithChildren<{}>) {
  const t = useTheme()
  return (
    <View
      style={[
        a.w_full,
        a.justify_center,
        a.p_xl, // Adjust when you have an arrow svg, or just use an image for all of these...
        {height: 70, backgroundColor: t.palette.contrast_50, borderRadius: 12},
      ]}>
      {children && <H5>{children}</H5>}
    </View>
  )
}
