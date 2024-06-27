import {useQuery} from '@tanstack/react-query'

import {resolveShortLink} from 'lib/link-meta/resolve-short-link'
import {parseStarterPackUri} from 'lib/strings/starter-pack'
import {STALE} from 'state/queries/index'

const ROOT_URI = 'https://go.bsky.app/'

const RQKEY_ROOT = 'resolved-short-link'
export const RQKEY = (code: string) => [RQKEY_ROOT, code]

export function useResolvedStarterPackShortLink({
  nameOrCode,
}: {
  nameOrCode: string
}) {
  return useQuery({
    queryKey: RQKEY(nameOrCode),
    queryFn: async () => {
      const code = nameOrCode.split('short-')[1]
      const uri = `${ROOT_URI}${code}`
      const res = await resolveShortLink(uri)
      return parseStarterPackUri(res)
    },
    retry: 1,
    enabled: Boolean(nameOrCode && nameOrCode.startsWith('short-')),
    staleTime: STALE.HOURS.ONE,
  })
}
