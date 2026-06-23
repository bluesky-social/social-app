import {type ReactNode} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {Newspaper_Stroke2_Corner2_Rounded as Newspaper} from '#/components/icons/Newspaper'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'
import {NEWS_REGIONS, NEWS_TOPICS} from '../sources'
import {SetupFooter} from './SetupFooter'
import {SetupHeader} from './SetupHeader'

export function SetupTopics({
  topics,
  regions,
  onChangeTopics,
  onChangeRegions,
  onBack,
  onReset,
  onNext,
}: {
  topics: string[]
  regions: string[]
  onChangeTopics: (next: string[]) => void
  onChangeRegions: (next: string[]) => void
  onBack: () => boolean | void
  onReset: () => void
  onNext: () => void
}) {
  const {t: l} = useLingui()

  // "All topics" is mutually exclusive with specific topics.
  const handleTopicsChange = (next: string[]) => {
    if (next.includes('all') && !topics.includes('all')) {
      onChangeTopics(['all'])
    } else if (next.includes('all') && next.length > 1) {
      onChangeTopics(next.filter(topic => topic !== 'all'))
    } else {
      onChangeTopics(next)
    }
  }

  return (
    <Layout.Screen testID="newsFeedSetupTopics">
      <SetupHeader step={1} onBack={onBack} />

      <Layout.Content
        style={[a.flex_1]}
        contentContainerStyle={[{paddingBottom: 96}]}>
        <View style={[a.px_xl, a.pt_lg, a.pb_lg, a.gap_md]}>
          <View style={[a.flex_row, a.gap_sm, a.align_center]}>
            <Newspaper />
            <Text
              style={[a.flex_1, a.text_xl, a.font_semi_bold, a.leading_tight]}>
              <Trans>What should your news feed cover?</Trans>
            </Text>
          </View>
          <Text style={[a.text_sm, a.leading_snug]}>
            <Trans>Select the regions and topics you care about.</Trans>
          </Text>
        </View>

        <Divider />

        <View style={[a.px_xl, a.pt_2xl, a.pb_lg]}>
          <Section
            titleText={<Trans>Regions</Trans>}
            hintText={<Trans>Where in the world</Trans>}>
            <Toggle.Group
              type="checkbox"
              label={l`Regions`}
              values={regions}
              onChange={onChangeRegions}>
              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                {NEWS_REGIONS.map(region => (
                  <Toggle.Item
                    key={region.id}
                    name={region.id}
                    label={region.label}>
                    <Chip label={region.label} />
                  </Toggle.Item>
                ))}
              </View>
            </Toggle.Group>
          </Section>
        </View>

        <Divider />

        <View style={[a.px_xl, a.pt_2xl, a.pb_lg]}>
          <Section
            titleText={<Trans>Topics</Trans>}
            hintText={<Trans>What kinds of stories</Trans>}>
            <Toggle.Group
              type="checkbox"
              label={l`Topics`}
              values={topics}
              onChange={handleTopicsChange}>
              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                {NEWS_TOPICS.map(topic => (
                  <Toggle.Item
                    key={topic.id}
                    name={topic.id}
                    label={topic.label}>
                    <Chip label={topic.label} />
                  </Toggle.Item>
                ))}
              </View>
            </Toggle.Group>
          </Section>
        </View>
      </Layout.Content>

      <SetupFooter>
        <View style={[a.flex_row, a.gap_sm]}>
          <Button
            testID="newsFeedTopicsResetBtn"
            label={l`Reset`}
            size="large"
            color="secondary"
            disabled={topics.length === 0 && regions.length === 0}
            onPress={onReset}>
            <ButtonText>
              <Trans>Reset</Trans>
            </ButtonText>
          </Button>
          <Button
            testID="newsFeedTopicsContinueBtn"
            label={l`Continue`}
            size="large"
            color="primary"
            disabled={topics.length === 0}
            onPress={onNext}
            style={[a.flex_1]}>
            <ButtonText>
              <Trans>Continue</Trans>
            </ButtonText>
          </Button>
        </View>
      </SetupFooter>
    </Layout.Screen>
  )
}

function Section({
  titleText,
  hintText,
  children,
}: {
  titleText: ReactNode
  hintText: ReactNode
  children: ReactNode
}) {
  const t = useTheme()
  return (
    <View style={[a.gap_md]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <Text style={[a.text_xl, a.font_semi_bold, a.leading_tight]}>
          {titleText}
        </Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
          {hintText}
        </Text>
      </View>
      {children}
    </View>
  )
}

// Matches the interest pills from the Interests settings (InterestButton) so
// selection looks consistent across the app.
function Chip({label}: {label: string}) {
  const t = useTheme()
  const ctx = Toggle.useItemContext()
  const interacted = ctx.hovered || ctx.focused || ctx.pressed

  return (
    <View
      style={[
        a.rounded_full,
        a.py_md,
        a.px_xl,
        t.atoms.bg_contrast_50,
        interacted && t.atoms.bg_contrast_100,
        ctx.selected && t.atoms.bg_contrast_900,
        ctx.selected && interacted && t.atoms.bg_contrast_975,
      ]}>
      <Text
        selectable={false}
        style={[
          {color: t.palette.contrast_900},
          a.font_semi_bold,
          ctx.selected && t.atoms.text_inverted,
        ]}>
        {label}
      </Text>
    </View>
  )
}
