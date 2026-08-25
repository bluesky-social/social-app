import {useMemo} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

export const interests = [
  'animals',
  'art',
  'books',
  'comedy',
  'comics',
  'culture',
  'dev',
  'education',
  'finance',
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
] as const
export type Interest = (typeof interests)[number]

// most popular selected interests
export const popularInterests = [
  'art',
  'gaming',
  'sports',
  'comics',
  'music',
  'politics',
  'photography',
  'science',
  'news',
] satisfies Interest[]

export function useInterestsDisplayNames() {
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
      finance: _(msg`Finance`),
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
    } satisfies Record<Interest, string>
  }, [_])
}
