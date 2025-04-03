import {useMemo, useState} from 'react'
import {type TextStyle,View, type ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import deepEqual from 'lodash.isequal'

import {
  preferencesQueryKey,
  usePreferencesQuery,
} from '#/state/queries/preferences'
import {type UsePreferencesQueryResponse} from '#/state/queries/preferences/types'
import {useAgent} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useGutters,useTheme} from '#/alf'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ContentPreferences() {
  const t = useTheme()
  const {_} = useLingui()
  const agent = useAgent()
  const qc = useQueryClient()
  const gutters = useGutters(['base'])
  const {data: preferences} = usePreferencesQuery()
  const [isSaving, setIsSaving] = useState(false)
  const saveInterests = useMemo(() => {
    return debounce(async (interests: string[]) => {
      setIsSaving(true)
      try {
        await agent.setInterestsPref({tags: interests})
        await qc.invalidateQueries({queryKey: preferencesQueryKey})
        Toast.show(
          _(msg({message: 'Content preferences updated!', context: 'toast'})),
        )
      } catch (error) {
        Toast.show(
          _(
            msg({
              message: 'Failed to save content prefefences.',
              context: 'toast',
            }),
          ),
          'xmark',
        )
      } finally {
        setIsSaving(false)
      }
    }, 1000)
  }, [_, agent, setIsSaving, qc])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Content preferences</Trans>
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
              Selecting interests from the list below helps us deliver you
              higher quality content.
            </Trans>
          </Text>

          <Divider />

          {preferences ? (
            <Inner preferences={preferences} saveInterests={saveInterests} />
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
  saveInterests,
}: {
  preferences: UsePreferencesQueryResponse
  saveInterests: (interests: string[]) => Promise<void>
}) {
  const {_} = useLingui()
  const interestsDisplayNames = useInterestsDisplayNames()
  const preselectedInterests = preferences.interests.tags || []
  const [interests, setInterests] = useState<string[]>(preselectedInterests)

  const onChangeInterests = async (interests: string[]) => {
    setInterests(interests)
    const isEdited = !deepEqual(interests, preselectedInterests)
    console.log(isEdited, {interests, preselectedInterests})
    if (isEdited) saveInterests(interests)
  }

  return (
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

function useInterestsDisplayNames() {
  const {_} = useLingui()

  return useMemo<Record<string, string>>(() => {
    return {
      // Keep this alphabetized
      animals: _(msg`Animals`),
      art: _(msg`Art`),
      books: _(msg`Books`),
      comedy: _(msg`Comedy`),
      comics: _(msg`Comics`),
      culture: _(msg`Culture`),
      dev: _(msg`Software Dev`),
      education: _(msg`Education`),
      food: _(msg`Food`),
      gaming: _(msg`Video Games`),
      journalism: _(msg`Journalism`),
      movies: _(msg`Movies`),
      music: _(msg`Music`),
      nature: _(msg`Nature`),
      news: _(msg`News`),
      pets: _(msg`Pets`),
      photography: _(msg`Photography`),
      politics: _(msg`Politics`),
      science: _(msg`Science`),
      sports: _(msg`Sports`),
      tech: _(msg`Tech`),
      tv: _(msg`TV`),
      writers: _(msg`Writers`),
    }
  }, [_])
}
