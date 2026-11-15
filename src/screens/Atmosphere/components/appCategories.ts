import {useLingui} from '@lingui/react/macro'

/**
 * Keys are the category values sent by the backend, in display order.
 */
export function useAtmosphereAppCategories(): {key: string; label: string}[] {
  const {t: l} = useLingui()
  return [
    {key: 'writing', label: l`Blogging`},
    {key: 'photography', label: l`Photo`},
    {key: 'video', label: l`Video`},
    {key: 'games', label: l`Games`},
    {key: 'feeds', label: l`Feeds`},
    {key: 'social', label: l`Social`},
    {key: 'dev', label: l`Dev`},
    {key: 'audio', label: l`Audio`},
    {key: 'events', label: l`Events`},
    {key: 'utils', label: l`Utils`},
  ]
}
