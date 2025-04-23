import {AppBskyActorDefs} from '@atproto/api'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {preferencesQueryKey} from '#/state/queries/preferences'
import {useAgent} from '#/state/session'

export function usePostInteractionSettingsMutation() {
  const qc = useQueryClient()
  const agent = useAgent()
  return useMutation({
    async mutationFn(props: AppBskyActorDefs.PostInteractionSettingsPref) {
      await agent.setPostInteractionSettings(props)
    },
    async onSuccess() {
      await qc.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
  })
}
