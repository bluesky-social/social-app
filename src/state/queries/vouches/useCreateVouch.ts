import {AppBskyGraphVouch} from '@atproto/api'
import {useMutation} from '@tanstack/react-query'

import {useSession, useAgent} from '#/state/session'
import {useVouchRecordSchema} from '#/state/queries/vouches/util'

export type CreateVouchProps = {
  subject: string
  relationship: AppBskyGraphVouch.Record['relationship']
}

export function useCreateVouch() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const vouchRecordSchema = useVouchRecordSchema()

  return useMutation({
    mutationFn: async (props: CreateVouchProps) => {
      const record: AppBskyGraphVouch.Record = {
        subject: props.subject,
        relationship: props.relationship,
        createdAt: new Date().toISOString(),
      }
      vouchRecordSchema.parse(record)
      return agent.app.bsky.graph.vouch.create(
        { repo: currentAccount!.did },
        record,
      )
    }
  })
}
