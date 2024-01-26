import React from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react'
import {msg, Trans} from '@lingui/macro'

import {atoms as a} from '#/alf'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline} from '#/components/icons/FilterTimeline'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Text} from '#/components/Typography'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {useAnalytics} from '#/lib/analytics/analytics'

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
import {IconCircle} from '#/screens/Onboarding/IconCircle'

export function StepFollowingFeed() {
  const {_} = useLingui()
  const {track} = useAnalytics()
  const {dispatch} = React.useContext(Context)

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

  const onContinue = React.useCallback(() => {
    dispatch({type: 'next'})
    track('OnboardingV2:StepFollowingFeed:End')
  }, [track, dispatch])

  React.useEffect(() => {
    track('OnboardingV2:StepFollowingFeed:Start')
  }, [track])

  return (
    // Hack for now to move the image container up
    <View style={[a.align_start]}>
      <IconCircle icon={FilterTimeline} style={[a.mb_2xl]} />

      <Title>
        <Trans>Your default feed is "Following"</Trans>
      </Title>
      <Description style={[a.mb_md]}>
        <Trans>It shows posts from the people you follow as they happen.</Trans>
      </Description>

      <View style={[a.w_full]}>
        <Toggle.Item
          name="Show Replies" // no need to translate
          label={_(msg`Show replies in Following feed`)}
          value={showReplies}
          onChange={() => {
            setFeedViewPref({
              hideReplies: showReplies,
            })
          }}>
          <View
            style={[
              a.flex_row,
              a.w_full,
              a.py_lg,
              a.justify_between,
              a.align_center,
            ]}>
            <Text style={[a.text_md, a.font_bold]}>
              <Trans>Show replies in Following</Trans>
            </Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
        <Divider />
        <Toggle.Item
          name="Show Reposts" // no need to translate
          label={_(msg`Show re-posts in Following feed`)}
          value={showReposts}
          onChange={() => {
            setFeedViewPref({
              hideReposts: showReposts,
            })
          }}>
          <View
            style={[
              a.flex_row,
              a.w_full,
              a.py_lg,
              a.justify_between,
              a.align_center,
            ]}>
            <Text style={[a.text_md, a.font_bold]}>
              <Trans>Show reposts in Following</Trans>
            </Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
        <Divider />
        <Toggle.Item
          name="Show Quotes" // no need to translate
          label={_(msg`Show quote-posts in Following feed`)}
          value={showQuotes}
          onChange={() => {
            setFeedViewPref({
              hideQuotePosts: showQuotes,
            })
          }}>
          <View
            style={[
              a.flex_row,
              a.w_full,
              a.py_lg,
              a.justify_between,
              a.align_center,
            ]}>
            <Text style={[a.text_md, a.font_bold]}>
              <Trans>Show quotes in Following</Trans>
            </Text>
            <Toggle.Switch />
          </View>
        </Toggle.Item>
      </View>

      <Description style={[a.mt_lg]}>
        <Trans>You can change these settings later.</Trans>
      </Description>

      <OnboardingControls.Portal>
        <Button
          variant="gradient"
          color="gradient_sky"
          size="large"
          label={_(msg`Continue to next step`)}
          onPress={onContinue}>
          <ButtonText>
            <Trans>Continue</Trans>
          </ButtonText>
          <ButtonIcon icon={ChevronRight} position="right" />
        </Button>
      </OnboardingControls.Portal>
    </View>
  )
}
