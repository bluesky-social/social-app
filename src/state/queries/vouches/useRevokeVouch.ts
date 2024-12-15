import {AppBskyGraphDefs, AtUri} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {useUpdateVouchesIssuedQueryCache} from '#/state/queries/vouches/useVouchesIssued'
import {useAgent,useSession} from '#/state/session'

export type RevokeVouchProps = {
  vouch: AppBskyGraphDefs.VouchView
}

export function useRevokeVouch() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const updateCache = useUpdateVouchesIssuedQueryCache()

  return useMutation({
    mutationFn: async (props: RevokeVouchProps) => {
      const {rkey} = new AtUri(props.vouch.uri)
      return agent.app.bsky.graph.vouch.delete({
        repo: currentAccount!.did,
        rkey,
      })
    },
    onSuccess(_, {vouch}) {
      updateCache(data => {
        if (!data) return data
        return {
          ...data,
          pages: data.pages.map(page => {
            return {
              ...page,
              vouches: page.vouches.filter(v => v.uri !== vouch.uri),
            }
          }),
        }
      })
    },
  })
}
