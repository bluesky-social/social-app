import {useMemo} from 'react'
import {
  type $Typed,
  type AppBskyActorDefs,
  type AppBskyActorStatus,
  AppBskyEmbedExternal,
  AtUri,
  ComAtprotoRepoPutRecord,
} from '@atproto/api'
import {retry} from '@atproto/common-web'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {isAfter, parseISO} from 'date-fns'

import {uploadBlob} from '#/lib/api'
import {imageToThumb} from '#/lib/api/resolve'
import {getLinkMeta, type LinkMeta} from '#/lib/link-meta/link-meta'
import {useAppConfig} from '#/state/appConfig'
import {
  updateProfileShadow,
  useMaybeProfileShadow,
} from '#/state/cache/profile-shadow'
import {useAgent, useSession} from '#/state/session'
import {useTickEveryMinute} from '#/state/shell'
import * as Toast from '#/view/com/util/Toast'
import {useDialogContext} from '#/components/Dialog'
import {useAnalytics} from '#/analytics'
import {getLiveNowHost, getLiveServiceNames} from '#/features/liveNow/utils'
import type * as bsky from '#/types/bsky'

export * from '#/features/liveNow/utils'

export const DEFAULT_ALLOWED_DOMAINS = [
  'twitch.tv',
  'stream.place',
  'bluecast.app',
]

export type LiveNowConfig = {
  canGoLive: boolean
  currentAccountAllowedHosts: Set<string>
  defaultAllowedHosts: Set<string>
  allowedHostsExceptionsByDid: Map<string, Set<string>>
}

export function useLiveNowConfig(): LiveNowConfig {
  const ax = useAnalytics()
  const {liveNow} = useAppConfig()
  const {currentAccount} = useSession()

  return useMemo(() => {
    const disabled = ax.features.enabled(ax.features.LiveNowBetaDisable)

    const defaultAllowedHosts = new Set(
      DEFAULT_ALLOWED_DOMAINS.concat(liveNow.allow),
    )
    const allowedHostsExceptionsByDid = new Map<string, Set<string>>()
    for (const ex of liveNow.exceptions) {
      allowedHostsExceptionsByDid.set(
        ex.did,
        new Set(DEFAULT_ALLOWED_DOMAINS.concat(ex.allow)),
      )
    }

    if (!currentAccount?.did || disabled) {
      return {
        canGoLive: false,
        currentAccountAllowedHosts: new Set(),
        defaultAllowedHosts,
        allowedHostsExceptionsByDid,
      }
    }

    return {
      canGoLive: true,
      currentAccountAllowedHosts:
        allowedHostsExceptionsByDid.get(currentAccount.did) ??
        defaultAllowedHosts,
      defaultAllowedHosts,
      allowedHostsExceptionsByDid,
    }
  }, [ax, liveNow, currentAccount])
}

export function useActorStatus(actor?: bsky.profile.AnyProfileView) {
  const shadowed = useMaybeProfileShadow(actor)
  const tick = useTickEveryMinute()
  const config = useLiveNowConfig()

  return useMemo(() => {
    void tick // revalidate every minute

    if (shadowed && 'status' in shadowed && shadowed.status) {
      const isValid = isStatusValidForViewers(shadowed.status, config)
      const isDisabled = shadowed.status.isDisabled || false
      const isActive = isStatusStillActive(shadowed.status.expiresAt)
      if (isValid && !isDisabled && isActive) {
        return {
          uri: shadowed.status.uri,
          cid: shadowed.status.cid,
          isDisabled: false,
          isActive: true,
          status: 'app.bsky.actor.status#live',
          embed: shadowed.status.embed as $Typed<AppBskyEmbedExternal.View>, // temp_isStatusValid asserts this
          expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
          record: shadowed.status.record,
        } satisfies AppBskyActorDefs.StatusView
      }
      return {
        uri: shadowed.status.uri,
        cid: shadowed.status.cid,
        isDisabled,
        isActive: false,
        status: 'app.bsky.actor.status#live',
        embed: shadowed.status.embed as $Typed<AppBskyEmbedExternal.View>, // temp_isStatusValid asserts this
        expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
        record: shadowed.status.record,
      } satisfies AppBskyActorDefs.StatusView
    } else {
      return {
        status: '',
        isDisabled: false,
        isActive: false,
        record: {},
      } satisfies AppBskyActorDefs.StatusView
    }
  }, [shadowed, config, tick])
}

export function isStatusStillActive(timeStr: string | undefined) {
  if (!timeStr) return false
  const now = new Date()
  const expiry = parseISO(timeStr)

  return isAfter(expiry, now)
}

/**
 * Validates whether the live status is valid for display in the app. Does NOT
 * validate if the status is valid for the acting user e.g. as they go live.
 */
export function isStatusValidForViewers(
  status: AppBskyActorDefs.StatusView,
  config: LiveNowConfig,
) {
  if (status.status !== 'app.bsky.actor.status#live') return false
  if (!status.uri) return false // should not happen, just backwards compat
  try {
    const {host: liveDid} = new AtUri(status.uri)
    if (AppBskyEmbedExternal.isView(status.embed)) {
      const host = getLiveNowHost(status.embed.external.uri)
      const exception = config.allowedHostsExceptionsByDid.get(liveDid)
      const isValidException = exception ? exception.has(host) : false
      const isValidForAnyone = config.defaultAllowedHosts.has(host)
      return isValidException || isValidForAnyone
    } else {
      return false
    }
  } catch {
    return false
  }
}

export function useLiveLinkMetaQuery(url: string | null) {
  const liveNowConfig = useLiveNowConfig()
  const {_} = useLingui()

  const agent = useAgent()
  return useQuery({
    enabled: !!url,
    queryKey: ['link-meta', url],
    queryFn: async () => {
      if (!url) return undefined
      const host = getLiveNowHost(url)
      if (!liveNowConfig.currentAccountAllowedHosts.has(host)) {
        const {formatted} = getLiveServiceNames(
          liveNowConfig.currentAccountAllowedHosts,
        )
        throw new Error(
          _(
            msg`This service is not supported while the Live feature is in beta. Allowed services: ${formatted}.`,
          ),
        )
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
  const ax = useAnalytics()
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
            ax.logger.error(`Failed to upload thumbnail for live status`, {
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
      ax.logger.error(`Failed to upsert live status`, {
        url: linkMeta?.url,
        image: linkMeta?.image,
        safeMessage: e,
      })
    },
    onSuccess: ({record, image}) => {
      if (createdAt) {
        ax.metric('live:edit', {duration: record.durationMinutes})
      } else {
        ax.metric('live:create', {duration: record.durationMinutes})
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
  const ax = useAnalytics()
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
      ax.logger.error(`Failed to remove live status`, {
        safeMessage: e,
      })
    },
    onSuccess: () => {
      ax.metric('live:remove', {})
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
