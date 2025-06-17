import {useMemo, useState} from 'react'
import {type TextStyle, View, type ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {useQueryClient} from '@tanstack/react-query'
import debounce from 'lodash.debounce'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {createGetSuggestedFeedsQueryKey} from '#/state/queries/trending/useGetSuggestedFeedsQuery'
import {createGetSuggestedUsersQueryKey} from '#/state/queries/trending/useGetSuggestedUsersQuery'
import {createSuggestedStarterPacksQueryKey} from '#/state/queries/useSuggestedStarterPacksQuery'
import {useAgent} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useInterestsDisplayNames} from '#/screens/Onboarding/state'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'InterestsSettings'>
export function InterestsSettingsScreen({}: Props) {
  const t = useTheme()
  const gutters = useGutters(['base'])
  const {data: preferences} = usePreferencesQuery()
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Your interests</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>{isSaving && <Loader />}</Layout.Header.Slot>
      </Layout.Header.Outer>
      <Layout.Content>
        <View style={[gutters, a.gap_lg]}>
          <Text
            style={[
              a.flex_1,
              a.text_sm,
              a.leading_snug,
              t.atoms.text_contrast_medium,
            ]}>
            <Trans>
              Your selected interests help us serve you content you care about.
            </Trans>
          </Text>

          <Divider />

          {preferences ? (
            <Inner preferences={preferences} setIsSaving={setIsSaving} />
          ) : (
            <View style={[a.flex_row, a.justify_center, a.p_lg]}>
              <Loader size="xl" />
            </View>
          )}
        </View>
      </Layout.Content>
    </Layout.Screen>
  )
}

function Inner({
  preferences,
  setIsSaving,
}: {
  preferences: UsePreferencesQueryResponse
  setIsSaving: (isSaving: boolean) => void
}) {
  const {_} = useLingui()
  const agent = useAgent()
  const qc = useQueryClient()
  const interestsDisplayNames = useInterestsDisplayNames()
  const preselectedInterests = useMemo(
    () => preferences.interests.tags || [],
    [preferences.interests.tags],
  )
  const [interests, setInterests] = useState<string[]>(preselectedInterests)

  const saveInterests = useMemo(() => {
    return debounce(async (interests: string[]) => {
      const noEdits =
        interests.length === preselectedInterests.length &&
        preselectedInterests.every(pre => {
          return interests.find(int => int === pre)
        })

      if (noEdits) return

      setIsSaving(true)

      try {
        await agent.setInterestsPref({tags: interests})
        qc.setQueriesData(
          {queryKey: preferencesQueryKey},
          (old?: UsePreferencesQueryResponse) => {
            if (!old) return old
            old.interests.tags = interests
            return old
          },
        )
        await Promise.all([
          qc.resetQueries({queryKey: createSuggestedStarterPacksQueryKey()}),
          qc.resetQueries({queryKey: createGetSuggestedFeedsQueryKey()}),
          qc.resetQueries({queryKey: createGetSuggestedUsersQueryKey({})}),
        ])

        Toast.show(
          _(
            msg({
              message: 'Your interests have been updated!',
              context: 'toast',
            }),
          ),
        )
      } catch (error) {
        Toast.show(
          _(
            msg({
              message: 'Failed to save your interests.',
              context: 'toast',
            }),
          ),
          'xmark',
        )
      } finally {
        setIsSaving(false)
      }
    }, 1500)
  }, [_, agent, setIsSaving, qc, preselectedInterests])

  const onChangeInterests = async (interests: string[]) => {
    setInterests(interests)
    saveInterests(interests)
  }

  return (
    <>
      {interests.length === 0 && (
        <Admonition type="tip">
          <Trans>We recommend selecting at least two interests.</Trans>
        </Admonition>
      )}

      <Toggle.Group
        values={interests}
        onChange={onChangeInterests}
        label={_(msg`Select your interests from the options below`)}>
        <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
          {INTERESTS.map(interest => {
            const name = interestsDisplayNames[interest]
            if (!name) return null
            return (
              <Toggle.Item
                key={interest}
                name={interest}
                label={interestsDisplayNames[interest]}>
                <InterestButton interest={interest} />
              </Toggle.Item>
            )
          })}
        </View>
      </Toggle.Group>
    </>
  )
}

export function InterestButton({interest}: {interest: string}) {
  const t = useTheme()
  const interestsDisplayNames = useInterestsDisplayNames()
  const ctx = Toggle.useItemContext()

  const styles = useMemo(() => {
    const hovered: ViewStyle[] = [t.atoms.bg_contrast_100]
    const focused: ViewStyle[] = []
    const pressed: ViewStyle[] = []
    const selected: ViewStyle[] = [t.atoms.bg_contrast_900]
    const selectedHover: ViewStyle[] = [t.atoms.bg_contrast_975]
    const textSelected: TextStyle[] = [t.atoms.text_inverted]

    return {
      hovered,
      focused,
      pressed,
      selected,
      selectedHover,
      textSelected,
    }
  }, [t])

  return (
    <View
      style={[
        a.rounded_full,
        a.py_md,
        a.px_xl,
        t.atoms.bg_contrast_50,
        ctx.hovered ? styles.hovered : {},
        ctx.focused ? styles.hovered : {},
        ctx.pressed ? styles.hovered : {},
        ctx.selected ? styles.selected : {},
        ctx.selected && (ctx.hovered || ctx.focused || ctx.pressed)
          ? styles.selectedHover
          : {},
      ]}>
      <Text
        selectable={false}
        style={[
          {
            color: t.palette.contrast_900,
          },
          a.font_bold,
          ctx.selected ? styles.textSelected : {},
        ]}>
        {interestsDisplayNames[interest]}
      </Text>
    </View>
  )
}

const INTERESTS = [
  'animals',
  'art',
  'books',
  'comedy',
  'comics',
  'culture',
  'dev',
  'education',
  'food',
  'gaming',
  'journalism',
  'movies',
  'music',
  'nature',
  'news',
  'pets',
  'photography',
  'politics',
  'science',
  'sports',
  'tech',
  'tv',
  'writers',
]
