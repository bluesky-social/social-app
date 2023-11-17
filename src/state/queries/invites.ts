import {ComAtprotoServerDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {getAgent} from '#/state/session'
import {STALE} from '#/state/queries'

function isInviteAvailable(invite: ComAtprotoServerDefs.InviteCode): boolean {
  return invite.available - invite.uses.length > 0 && !invite.disabled
}

export type InviteCodesQueryResponse = Exclude<
  ReturnType<typeof useInviteCodesQuery>['data'],
  undefined
>
export function useInviteCodesQuery() {
  return useQuery({
    staleTime: STALE.HOURS.ONE,
    queryKey: ['inviteCodes'],
    queryFn: async () => {
      const res = await getAgent().com.atproto.server.getAccountInviteCodes({})

      if (!res.data?.codes) {
        throw new Error(`useInviteCodesQuery: no codes returned`)
      }

      const available = res.data.codes.filter(isInviteAvailable)
      const used = res.data.codes.filter(code => !isInviteAvailable(code))

      return {
        all: [...available, ...used],
        available,
        used,
      }
    },
  })
}
