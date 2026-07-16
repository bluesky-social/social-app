import {setPostInteractionSettings} from '@bsky.app/sdk'
import {useMutation, useQueryClient} from '@tanstack/react-query'

import {preferencesQueryKey} from '#/state/queries/preferences'
import {usePdsClient} from '#/state/session'
import {app} from '#/lexicons'

export function usePostInteractionSettingsMutation({
  onError,
  onSettled,
}: {
  onError?: (error: Error) => void
  onSettled?: () => void
} = {}) {
  const qc = useQueryClient()
  const client = usePdsClient()
  return useMutation({
    async mutationFn(props: app.bsky.actor.defs.PostInteractionSettingsPref) {
      await client.call(setPostInteractionSettings, props)
    },
    async onSuccess() {
      await qc.invalidateQueries({
        queryKey: preferencesQueryKey,
      })
    },
    onError,
    onSettled,
  })
}
