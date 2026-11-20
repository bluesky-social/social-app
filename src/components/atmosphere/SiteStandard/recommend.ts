import {useSyncExternalStore} from 'react'
import {AtUri, type AtUriString, toDatetimeString} from '@atproto/syntax'
import {EventEmitter} from 'eventemitter3'

import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {usePdsClient, useSession} from '#/state/session'
import {isStandardSiteDocumentUri} from '#/components/atmosphere/SiteStandard/utils'
import {type app, site} from '#/lexicons'

/**
 * Optimistic override of a document's `viewer.like`, shared by every card for
 * the document whichever query it came from. It only applies while a view
 * still has the server state it was based on, so once a refetch catches up,
 * the server wins.
 */
type RecommendShadow = {
  /** `'pending'` while the record is being created. */
  likeUri: AtUriString | 'pending' | undefined
  baseLike: AtUriString | undefined
  baseCount: number
}

const shadows = new Map<string, RecommendShadow>()
const emitter = new EventEmitter()

function updateShadow(
  key: string,
  likeUri: RecommendShadow['likeUri'],
  view: app.bsky.embed.external.ViewArticle,
) {
  shadows.set(key, {
    likeUri,
    baseLike: view.viewer?.like,
    baseCount: view.likeCount ?? 0,
  })
  emitter.emit(key)
}

export function useDocumentRecommend(
  view: app.bsky.embed.external.ViewArticle,
) {
  const {currentAccount} = useSession()
  const pdsClient = usePdsClient()
  const documentUri = view.associatedRefs?.find(isStandardSiteDocumentUri)?.uri
  const did = currentAccount?.did
  const key = did && documentUri ? `${did}:${documentUri}` : undefined

  const shadow = useSyncExternalStore(
    onChange => {
      if (!key) return () => {}
      emitter.on(key, onChange)
      return () => {
        emitter.off(key, onChange)
      }
    },
    () => (key ? shadows.get(key) : undefined),
  )

  const serverLike = view.viewer?.like
  const serverCount = view.likeCount ?? 0
  const isShadowed =
    shadow?.baseLike === serverLike && shadow?.baseCount === serverCount
  const likeUri = isShadowed ? shadow.likeUri : serverLike
  const likeCount = isShadowed
    ? Math.max(0, serverCount + Number(!!likeUri) - Number(!!serverLike))
    : serverCount

  const queueToggle = useToggleMutationQueue<AtUriString | undefined>({
    initialState: likeUri === 'pending' ? undefined : likeUri,
    runMutation: async (prevUri, shouldRecommend) => {
      if (!did || !documentUri) return prevUri
      if (shouldRecommend) {
        const res = await pdsClient.create(
          site.standard.graph.recommend,
          {document: documentUri, createdAt: toDatetimeString(new Date())},
          {repo: did},
        )
        return res.uri
      }
      if (prevUri) {
        await pdsClient.delete(site.standard.graph.recommend, {
          repo: did,
          rkey: new AtUri(prevUri).rkey,
        })
      }
      return undefined
    },
    onSuccess(finalUri) {
      if (key) updateShadow(key, finalUri, view)
    },
  })

  return {
    /** Only standard.site documents can be recommended. */
    canRecommend: !!documentUri,
    isRecommended: !!likeUri,
    likeCount,
    recommend() {
      if (key) updateShadow(key, 'pending', view)
      return queueToggle(true)
    },
    unrecommend() {
      if (key) updateShadow(key, undefined, view)
      return queueToggle(false)
    },
  }
}
