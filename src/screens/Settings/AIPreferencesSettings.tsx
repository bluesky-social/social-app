import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  useAIPreferencesQuery,
  useUpdateAIPreferencesMutation,
} from '#/state/queries/ai-preferences'
import {preferenceSetToTriStates} from '#/state/queries/ai-preferences/serde'
import {
  AI_PREFERENCE_CATEGORIES,
  type AIPreferenceCategory,
} from '#/state/queries/ai-preferences/types'
import * as SettingsList from '#/screens/Settings/components/SettingsList'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import * as ToggleButton from '#/components/forms/ToggleButton'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AIPreferencesSettings'
>

export function AIPreferencesSettingsScreen({}: Props) {
  const {_} = useLingui()
  const t = useTheme()

  const {data: record, isLoading} = useAIPreferencesQuery()
  const {mutate} = useUpdateAIPreferencesMutation()

  // The mutation's onMutate writes the optimistic record straight to the
  // cache, so reading triStates from `record` already reflects in-flight taps.
  const triStates = preferenceSetToTriStates(record?.preferences)

  const allowLabel = _(msg`Allow`)
  const unsetLabel = _(msg`No preference`)
  const denyLabel = _(msg`Deny`)

  const categoryCopy = useCategoryCopy()

  const onChange = (category: AIPreferenceCategory) => (values: string[]) => {
    const value = values[0]
    if (value !== 'allow' && value !== 'deny' && value !== 'unset') return
    mutate({[category]: value})
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>AI preferences</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[a.px_lg, a.pt_md, a.pb_lg, a.gap_sm]}>
          <View style={[a.flex_row, a.align_center, a.gap_xs, a.flex_wrap]}>
            <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
              <Trans>Determine how AI may use your data</Trans>
            </Text>
            <View
              style={[
                a.px_sm,
                a.py_2xs,
                a.rounded_full,
                t.atoms.bg_contrast_25,
              ]}>
              <Text
                style={[
                  a.text_xs,
                  a.font_semi_bold,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>Experimental</Trans>
              </Text>
            </View>
          </View>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              You can adjust these settings to configure how AI systems may use
              your data across the AT Protocol network. In an open source
              system, your data stays public, but you can say how AI should
              handle it.
            </Trans>
          </Text>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Blacksky will follow the preferences you set here. We will share
              your preferences with other AT Protocol services who can choose to
              respect them. Bad actors may ignore these signals and work around
              them, which is outside the control of Blacksky, your PDS operator,
              and other intermediary services on the network.
            </Trans>
          </Text>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              These preferences apply across your entire account. We will
              continue to build more granular controls for your settings - for
              example, allowing you to set rules for specific AI services or
              specific types of content - and will update this page when those
              are ready.
            </Trans>
          </Text>
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Safety tools like spam and bot detection aren't affected. They
              stay on for everyone.
            </Trans>
          </Text>
        </View>

        <SettingsList.Container>
          {isLoading && !record ? (
            <View style={[a.px_lg, a.py_lg, a.align_center]}>
              <Loader />
            </View>
          ) : (
            AI_PREFERENCE_CATEGORIES.map(category => {
              const copy = categoryCopy[category]
              return (
                <CategoryRow
                  key={category}
                  name={copy.name}
                  description={copy.description}
                  value={triStates[category]}
                  allowLabel={allowLabel}
                  unsetLabel={unsetLabel}
                  denyLabel={denyLabel}
                  onChange={onChange(category)}
                />
              )
            })
          )}
        </SettingsList.Container>
      </Layout.Content>
    </Layout.Screen>
  )
}

function CategoryRow({
  name,
  description,
  value,
  allowLabel,
  unsetLabel,
  denyLabel,
  onChange,
}: {
  name: string
  description: string
  value: 'allow' | 'deny' | 'unset'
  allowLabel: string
  unsetLabel: string
  denyLabel: string
  onChange: (values: string[]) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const {gtPhone} = useBreakpoints()

  return (
    <View
      style={[
        a.flex_row,
        a.gap_sm,
        a.px_lg,
        a.py_lg,
        a.justify_between,
        a.flex_wrap,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <View style={[a.gap_xs, a.flex_1]}>
        <Text style={[a.font_semi_bold, gtPhone ? a.text_sm : a.text_md]}>
          {name}
        </Text>
        <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
          {description}
        </Text>
      </View>
      <View style={[{minHeight: 35}, a.w_full]}>
        <ToggleButton.Group
          label={_(msg`Configure AI preference for: ${name}`)}
          values={[value]}
          onChange={onChange}>
          <ToggleButton.Button name="allow" label={allowLabel}>
            <ToggleButton.ButtonText>{allowLabel}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="unset" label={unsetLabel}>
            <ToggleButton.ButtonText>{unsetLabel}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button name="deny" label={denyLabel}>
            <ToggleButton.ButtonText>{denyLabel}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>
      </View>
    </View>
  )
}

function useCategoryCopy(): Record<
  AIPreferenceCategory,
  {name: string; description: string}
> {
  const {_} = useLingui()
  return {
    training: {
      name: _(msg`Training`),
      description: _(
        msg`Use your data to build or train new AI models. Once your work is in a model, it stays there, even if you delete your account later.`,
      ),
    },
    inference: {
      name: _(msg`Inference`),
      description: _(
        msg`Look up your data when AI is answering someone's question. The AI doesn't keep it, but it might quote or reference it in real time.`,
      ),
    },
    syntheticContent: {
      name: _(msg`Synthetic content`),
      description: _(
        msg`Generate new content or interactions modeled on your data. This includes AI imitations of your writing, AI-generated versions of your photos or audio, or bots designed to sound like you.`,
      ),
    },
    embedding: {
      name: _(msg`Embedding`),
      description: _(
        msg`Use your data in AI search and recommendation systems. This is how AI finds similar accounts, groups users by interests, and decides what to show in personalized feeds (e.g. 'discover', 'for you', etc.)`,
      ),
    },
  }
}
