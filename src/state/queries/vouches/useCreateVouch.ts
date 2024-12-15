import {AppBskyGraphVouch} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {poll} from '#/lib/async/poll'
import {
  useUpdateVouchesIssuedQueryCache,
  vouchesIssuedQueryKey,
} from '#/state/queries/vouches/useVouchesIssued'
import {useVouchRecordSchema} from '#/state/queries/vouches/util'
import {useAgent,useSession} from '#/state/session'

export type CreateVouchProps = {
  subject: string
  relationship: AppBskyGraphVouch.Record['relationship']
}

export function useCreateVouch() {
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const agent = useAgent()
  const vouchRecordSchema = useVouchRecordSchema()
  const updateCache = useUpdateVouchesIssuedQueryCache()

  return useMutation({
    mutationFn: async (props: CreateVouchProps) => {
      const record: AppBskyGraphVouch.Record = {
        subject: props.subject,
        relationship: props.relationship,
        createdAt: new Date().toISOString(),
      }
      vouchRecordSchema.parse(record)
      return agent.app.bsky.graph.vouch.create(
        {repo: currentAccount!.did},
        record,
      )
    },
    async onSuccess({uri}) {
      const vouch = await poll(
        5,
        1e3,
        ({response}) => {
          if (!response) return false
          if (response.uri === uri) return true
          return false
        },
        async () => {
          const {data} = await agent.app.bsky.graph.getVouchesGiven({
            actor: currentAccount!.did,
            includeUnaccepted: true,
            limit: 1,
          })
          return data.vouches.at(0)
        },
      )

      if (vouch) {
        updateCache(data => {
          if (!data) {
            // no cache, fetch fresh
            queryClient.invalidateQueries({queryKey: vouchesIssuedQueryKey})
            return
          }

          return {
            ...data,
            pages: data.pages.map((page, i) => {
              return {
                ...page,
                vouches: i === 0 ? [vouch, ...page.vouches] : page.vouches,
              }
            }),
          }
        })
      }
    },
  })
}
