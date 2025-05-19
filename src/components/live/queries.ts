import {
  type $Typed,
  type AppBskyActorStatus,
  type AppBskyEmbedExternal,
  ComAtprotoRepoPutRecord,
} from '@atproto/api'
import {retry} from '@atproto/common-web'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {uploadBlob} from '#/lib/api'
import {imageToThumb} from '#/lib/api/resolve'
import {getLinkMeta, type LinkMeta} from '#/lib/link-meta/link-meta'
import {logger} from '#/logger'
import {updateProfileShadow} from '#/state/cache/profile-shadow'
import {useLiveNowConfig} from '#/state/service-config'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/view/com/util/Toast'
import {useDialogContext} from '#/components/Dialog'

export function useLiveLinkMetaQuery(url: string | null) {
  const liveNowConfig = useLiveNowConfig()
  const {currentAccount} = useSession()
  const {_} = useLingui()

  const agent = useAgent()
  return useQuery({
    enabled: !!url,
    queryKey: ['link-meta', url],
    queryFn: async () => {
      if (!url) return undefined
      const config = liveNowConfig.find(cfg => cfg.did === currentAccount?.did)

      if (!config) throw new Error(_(msg`You are not allowed to go live`))

      const urlp = new URL(url)
      if (!config.domains.includes(urlp.hostname)) {
        throw new Error(_(msg`${urlp.hostname} is not a valid URL`))
      }

      return await getLinkMeta(agent, url)
    },
  })
}

export function useUpsertLiveStatusMutation(
  duration: number,
  linkMeta: LinkMeta | null | undefined,
  createdAt?: string,
) {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const control = useDialogContext()
  const {_} = useLingui()

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not logged in')

      let embed: $Typed<AppBskyEmbedExternal.Main> | undefined

      if (linkMeta) {
        let thumb

        if (linkMeta.image) {
          try {
            const img = await imageToThumb(linkMeta.image)
            if (img) {
              const blob = await uploadBlob(
                agent,
                img.source.path,
                img.source.mime,
              )
              thumb = blob.data.blob
            }
          } catch (e: any) {
            logger.error(`Failed to upload thumbnail for live status`, {
              url: linkMeta.url,
              image: linkMeta.image,
              safeMessage: e,
            })
          }
        }

        embed = {
          $type: 'app.bsky.embed.external',
          external: {
            $type: 'app.bsky.embed.external#external',
            title: linkMeta.title ?? '',
            description: linkMeta.description ?? '',
            uri: linkMeta.url,
            thumb,
          },
        }
      }

      const record = {
        $type: 'app.bsky.actor.status',
        createdAt: createdAt ?? new Date().toISOString(),
        status: 'app.bsky.actor.status#live',
        durationMinutes: duration,
        embed,
      } satisfies AppBskyActorStatus.Record

      const upsert = async () => {
        const repo = currentAccount.did
        const collection = 'app.bsky.actor.status'

        const existing = await agent.com.atproto.repo
          .getRecord({repo, collection, rkey: 'self'})
          .catch(_e => undefined)

        await agent.com.atproto.repo.putRecord({
          repo,
          collection,
          rkey: 'self',
          record,
          swapRecord: existing?.data.cid || null,
        })
      }

      await retry(upsert, {
        maxRetries: 5,
        retryable: e => e instanceof ComAtprotoRepoPutRecord.InvalidSwapError,
      })

      return {
        record,
        image: linkMeta?.image,
      }
    },
    onError: (e: any) => {
      logger.error(`Failed to upsert live status`, {
        url: linkMeta?.url,
        image: linkMeta?.image,
        safeMessage: e,
      })
    },
    onSuccess: ({record, image}) => {
      if (createdAt) {
        logger.metric('live:edit', {duration: record.durationMinutes})
      } else {
        logger.metric('live:create', {duration: record.durationMinutes})
      }

      Toast.show(_(msg`You are now live!`))
      control.close(() => {
        if (!currentAccount) return

        const expiresAt = new Date(record.createdAt)
        expiresAt.setMinutes(expiresAt.getMinutes() + record.durationMinutes)

        updateProfileShadow(queryClient, currentAccount.did, {
          status: {
            $type: 'app.bsky.actor.defs#statusView',
            status: 'app.bsky.actor.status#live',
            isActive: true,
            expiresAt: expiresAt.toISOString(),
            embed:
              record.embed && image
                ? {
                    $type: 'app.bsky.embed.external#view',
                    external: {
                      ...record.embed.external,
                      $type: 'app.bsky.embed.external#viewExternal',
                      thumb: image,
                    },
                  }
                : undefined,
            record,
          },
        })
      })
    },
  })
}

export function useRemoveLiveStatusMutation() {
  const {currentAccount} = useSession()
  const agent = useAgent()
  const queryClient = useQueryClient()
  const control = useDialogContext()
  const {_} = useLingui()

  return useMutation({
    mutationFn: async () => {
      if (!currentAccount) throw new Error('Not logged in')

      await agent.app.bsky.actor.status.delete({
        repo: currentAccount.did,
        rkey: 'self',
      })
    },
    onError: (e: any) => {
      logger.error(`Failed to remove live status`, {
        safeMessage: e,
      })
    },
    onSuccess: () => {
      logger.metric('live:remove', {})
      Toast.show(_(msg`You are no longer live`))
      control.close(() => {
        if (!currentAccount) return

        updateProfileShadow(queryClient, currentAccount.did, {
          status: undefined,
        })
      })
    },
  })
}
