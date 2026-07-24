import {useMemo} from 'react'
import {useLingui} from '@lingui/react/macro'

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
  const {t: l} = useLingui()

  return useMemo<Record<string, string>>(() => {
    return {
      // Keep this alphabetized
      animals: l`Animals`,
      art: l`Art`,
      books: l`Books`,
      comedy: l`Comedy`,
      comics: l`Comics`,
      culture: l`Culture`,
      dev: l`Software Dev`,
      education: l`Education`,
      finance: l`Finance`,
      food: l`Food`,
      gaming: l`Video Games`,
      journalism: l`Journalism`,
      movies: l`Movies`,
      music: l`Music`,
      nature: l`Nature`,
      news: l`News`,
      pets: l`Pets`,
      photography: l`Photography`,
      politics: l`Politics`,
      science: l`Science`,
      sports: l`Sports`,
      tech: l`Tech`,
      tv: l`TV`,
      writers: l`Writers`,
    } satisfies Record<Interest, string>
  }, [l])
}
