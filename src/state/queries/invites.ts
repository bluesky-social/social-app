import {ComAtprotoServerDefs} from '@atproto/api'
import {useQuery} from '@tanstack/react-query'

import {cleanError} from '#/lib/strings/errors'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

function isInviteAvailable(invite: ComAtprotoServerDefs.InviteCode): boolean {
  return invite.available - invite.uses.length > 0 && !invite.disabled
}

const inviteCodesQueryKeyRoot = 'inviteCodes'

export type InviteCodesQueryResponse = Exclude<
  ReturnType<typeof useInviteCodesQuery>['data'],
  undefined
>
export function useInviteCodesQuery() {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: [inviteCodesQueryKeyRoot],
    queryFn: async () => {
      const res = await agent.com.atproto.server
        .getAccountInviteCodes({})
        .catch(e => {
          if (cleanError(e) === 'Bad token scope') {
            return null
          } else {
            throw e
          }
        })

      if (res === null) {
        return {
          disabled: true,
          all: [],
          available: [],
          used: [],
        }
      }

      if (!res.data?.codes) {
        throw new Error(`useInviteCodesQuery: no codes returned`)
      }

      const available = res.data.codes.filter(isInviteAvailable)
      const used = res.data.codes
        .filter(code => !isInviteAvailable(code))
        .sort((a, b) => {
          return (
            new Date(b.uses[0].usedAt).getTime() -
            new Date(a.uses[0].usedAt).getTime()
          )
        })

      return {
        disabled: false,
        all: [...available, ...used],
        available,
        used,
      }
    },
  })
}
