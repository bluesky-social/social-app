import {useQuery} from '@tanstack/react-query'

import {createQueryKey} from '#/state/queries/util'
import {getInstalledSharePlatforms} from './detect'

const useInstalledSharePlatformsKeyRoot = 'useInstalledSharePlatforms'

/**
 * The catalog platforms installed on this device, in display order.
 * `undefined` while checking.
 *
 * Checks again every time the component mounts, which for the share sheet is
 * every time it opens, and drops the result once it unmounts. Apps get
 * installed and removed while the app is running, and which apps someone has
 * is sensitive, so it isn't kept around.
 */
export function useInstalledSharePlatforms({enabled}: {enabled: boolean}) {
  const {data} = useQuery({
    queryKey: createQueryKey(useInstalledSharePlatformsKeyRoot, {}),
    queryFn: getInstalledSharePlatforms,
    staleTime: 0,
    gcTime: 0,
    enabled,
  })
  return data
}
