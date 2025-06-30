import {useMemo, useState} from 'react'
import {type TextStyle, View, type ViewStyle} from 'react-native'
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'
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

function Inner({}: {
  preferences: UsePreferencesQueryResponse
  setIsSaving: (isSaving: boolean) => void
}) {
  const {_} = useLingui()
  const interestsDisplayNames = useInterestsDisplayNames()
  const [interests, setInterests] = useState<string[]>([])

  const onChangeInterests = async (interests: string[]) => {
    setInterests(interests)
  }

  const additional = interests.filter(
    interest =>
      Object.keys(findRecursive(interest, INTERESTS) ?? {}).length > 0,
  )

  console.log('react', findRecursive('react', INTERESTS))

  return (
    <>
      <Toggle.Group
        values={interests}
        onChange={onChangeInterests}
        label={_(msg`Select your interests from the options below`)}>
        <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
          {Object.keys(INTERESTS).map(interest => {
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
        {additional.map(interest => {
          const found = findRecursive(interest, INTERESTS) ?? {}
          console.log(interest)
          console.log(found)
          console.log(
            interests.map(
              interest => interest + findRecursive(interest, found),
            ),
          )
          console.log(
            interests
              .map(interest =>
                Object.keys(findRecursive(interest, found) ?? {}),
              )
              .filter(x => Boolean(x) && x.length > 0)
              .flat(),
          )
          const pills = [
            ...Object.keys(found),
            ...interests
              .map(interest =>
                Object.keys(findRecursive(interest, found) ?? {}),
              )
              .filter(x => Boolean(x) && x.length > 0)
              .flat(),
          ]
          return (
            <Animated.View
              key={interest}
              style={[a.mt_xl]}
              entering={FadeInDown}
              exiting={FadeOut}
              layout={LinearTransition.duration(100)}>
              <Text style={[a.font_heavy, a.text_lg, a.mb_lg]}>{interest}</Text>
              <View style={[a.flex_row, a.flex_wrap, a.gap_sm]}>
                {pills.map((interest, index) => {
                  return (
                    <Animated.View
                      key={interest}
                      entering={FadeIn.delay(index * 100)}>
                      <Toggle.Item name={interest} label={interest}>
                        <InterestButton interest={interest} />
                      </Toggle.Item>
                    </Animated.View>
                  )
                })}
              </View>
            </Animated.View>
          )
        })}
      </Toggle.Group>
    </>
  )
}

export function InterestButton({interest}: {interest: string}) {
  const t = useTheme()
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
          {color: t.palette.contrast_900},
          a.font_bold,
          ctx.selected ? styles.textSelected : {},
        ]}>
        {interest}
      </Text>
    </View>
  )
}

type Interests = Record<
  string,
  {} | Record<string, {} | Record<string, {} | Record<string, {}>>>
>

function findRecursive(
  interest: string,
  interests: Interests,
): Interests | null {
  if (interests[interest]) return interests[interest]
  for (const key in interests) {
    const found = findRecursive(key, interests[key])
    if (found) return found
  }
  return null
}

const INTERESTS = {
  animals: {},
  art: {
    comics: {},
    illustration: {
      'digital art': {},
      'hand drawn': {},
      'furry art': {},
    },
    painting: {
      watercolor: {},
      'fine art': {},
    },
    'fan art': {},
    sculpture: {},
    'art history': {},
  },
  books: {},
  comedy: {},
  culture: {},
  dev: {
    'web dev': {
      design: {},
      css: {},
      react: {
        'react native': {},
      },
      svelte: {},
      typescript: {},
    },
    'game dev': {},
    atproto: {},
  },
  education: {},
  food: {},
  gaming: {},
  journalism: {},
  movies: {},
  music: {},
  nature: {},
  news: {},
  pets: {
    cats: {},
    dogs: {},
    birds: {
      parrots: {},
      canaries: {},
      finches: {},
    },
    fish: {},
    reptiles: {},
    bunnies: {},
  },
  photography: {},
  politics: {},
  science: {},
  sports: {},
  tech: {},
  tv: {},
  writers: {},
}
