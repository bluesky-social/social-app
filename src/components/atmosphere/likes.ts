import {useSyncExternalStore} from 'react'
import {type Client} from '@atproto/lex'
import {
  AtUri,
  type AtUriString,
  type DidString,
  toDatetimeString,
} from '@atproto/syntax'
import {useLingui} from '@lingui/react/macro'
import {EventEmitter} from 'eventemitter3'

import {useHaptics} from '#/lib/haptics'
import {useToggleMutationQueue} from '#/lib/hooks/useToggleMutationQueue'
import {isNetworkError} from '#/lib/network-error'
import {logger} from '#/logger'
import {usePdsClient, useRequireAuth, useSession} from '#/state/session'
import {useAtmosphereFeedback} from '#/screens/Atmosphere/feedback'
import {useLogContentAction} from '#/screens/Atmosphere/metrics/context'
import {useAtmosphereFirstActionWelcome} from '#/components/atmosphere/AtmosphereFirstActionWelcomeDialog'
import * as Toast from '#/components/Toast'
import {type app, type com, site, social} from '#/lexicons'

/**
 * The like-style records the viewer can write for external views: a
 * recommend of a standard.site document, a favorite of a Grain gallery, or a
 * subscription to a standard.site publication. The appview returns the
 * viewer's record for the first two as `viewer.like`, and for a publication as
 * `viewer.subscription` (see `toSubscribableView`).
 */
export type AtmosphereLikeKind = 'recommend' | 'favorite' | 'subscribe'

/** The parts of an article or gallery view a like needs. */
export type LikeableView = {
  likeCount?: number
  viewer?: {like?: AtUriString}
  associatedRefs?: com.atproto.repo.strongRef.Main[]
}

/**
 * A publication's subscription in the shape of a like, so subscribing shares
 * the like plumbing.
 */
export function toSubscribableView(
  view: app.bsky.embed.external.ViewArticlePublication,
): LikeableView {
  return {
    likeCount: view.subscriptionCount,
    // Keeps an unknown viewer unknown, so `canLike` stays false.
    viewer: view.viewer && {like: view.viewer.subscription},
    associatedRefs: view.associatedRefs,
  }
}

const KINDS: Record<
  AtmosphereLikeKind,
  {
    /** The collection of the record being liked, found in `associatedRefs`. */
    subjectCollection: string
    create(
      client: Client,
      repo: DidString,
      subject: AtUriString,
    ): Promise<{uri: AtUriString}>
    delete(client: Client, repo: DidString, rkey: string): Promise<unknown>
  }
> = {
  recommend: {
    subjectCollection: site.standard.document.$type,
    create: (client, repo, document) =>
      client.create(
        site.standard.graph.recommend,
        {document, createdAt: toDatetimeString(new Date())},
        {repo},
      ),
    delete: (client, repo, rkey) =>
      client.delete(site.standard.graph.recommend, {repo, rkey}),
  },
  favorite: {
    subjectCollection: social.grain.gallery.$type,
    create: (client, repo, subject) =>
      client.create(
        social.grain.favorite,
        {subject, createdAt: toDatetimeString(new Date())},
        {repo},
      ),
    delete: (client, repo, rkey) =>
      client.delete(social.grain.favorite, {repo, rkey}),
  },
  subscribe: {
    subjectCollection: site.standard.publication.$type,
    create: (client, repo, publication) =>
      client.create(
        site.standard.graph.subscription,
        {publication, createdAt: toDatetimeString(new Date())},
        {repo},
      ),
    delete: (client, repo, rkey) =>
      client.delete(site.standard.graph.subscription, {repo, rkey}),
  },
}

/**
 * Optimistic override of a record's `viewer.like`, shared by every view of
 * the record whichever query it came from. It applies to any view whose
 * server `viewer.like` is still `baseLike`, even if its `likeCount` differs
 * from the view the toggle came from. Once a refetch reports a different
 * `viewer.like`, the server wins. A refetch that counts the new like before
 * returning `viewer.like` can briefly overcount by one.
 */
type LikeShadow = {
  /** `'pending'` while the record is being created. */
  likeUri: AtUriString | 'pending' | undefined
  baseLike: AtUriString | undefined
}

const shadows = new Map<string, LikeShadow>()
const emitter = new EventEmitter()

function updateShadow(
  key: string,
  likeUri: LikeShadow['likeUri'],
  view: LikeableView,
) {
  shadows.set(key, {
    likeUri,
    baseLike: view.viewer?.like,
  })
  emitter.emit(key)
}

/** The viewer's like of a record and its count, with any optimistic change. */
function useLikeState(view: LikeableView, kind: AtmosphereLikeKind) {
  const {currentAccount} = useSession()
  const {subjectCollection} = KINDS[kind]
  const subjectUri = view.associatedRefs?.find(
    ref => new AtUri(ref.uri).collection === subjectCollection,
  )?.uri
  const did = currentAccount?.did
  const key = did && subjectUri ? `${did}:${subjectUri}` : undefined

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
  const isShadowed = !!shadow && shadow.baseLike === serverLike
  const likeUri = isShadowed ? shadow.likeUri : serverLike
  const likeCount = isShadowed
    ? Math.max(0, serverCount + Number(!!likeUri) - Number(!!serverLike))
    : serverCount

  return {did, subjectUri, key, likeUri, likeCount}
}

/** A record's like count, including the viewer's optimistic like. */
export function useAtmosphereLikeCount(
  view: LikeableView,
  kind: AtmosphereLikeKind,
) {
  return useLikeState(view, kind).likeCount
}

/**
 * Likes and unlikes a record from any of its views. Toggles queue, so rapid
 * presses settle on the last one, and every view of the record updates
 * optimistically. The first like welcomes the viewer to the Atmosphere, so
 * callers must render `AtmosphereFirstActionWelcomeDialog` with
 * `firstActionWelcomeDialogControl`.
 */
export function useAtmosphereLike(
  view: LikeableView,
  kind: AtmosphereLikeKind,
  /** Where the button is, for metrics. */
  source: 'card' | 'photoDialog',
) {
  const {t: l} = useLingui()
  const pdsClient = usePdsClient()
  const haptics = useHaptics()
  const requireAuth = useRequireAuth()
  const sendFeedback = useAtmosphereFeedback()
  const logAction = useLogContentAction()
  const firstActionWelcome = useAtmosphereFirstActionWelcome()
  const {did, subjectUri, key, likeUri, likeCount} = useLikeState(view, kind)

  const queueToggle = useToggleMutationQueue<AtUriString | undefined>({
    initialState: likeUri === 'pending' ? undefined : likeUri,
    runMutation: async (prevUri, shouldLike) => {
      if (!did || !subjectUri) return prevUri
      if (shouldLike) {
        const res = await KINDS[kind].create(pdsClient, did, subjectUri)
        return res.uri
      }
      if (prevUri) {
        await KINDS[kind].delete(pdsClient, did, new AtUri(prevUri).rkey)
      }
      return undefined
    },
    onSuccess(finalUri) {
      if (key) updateShadow(key, finalUri, view)
    },
  })

  const isLiked = !!likeUri

  const toggle = () =>
    requireAuth(async () => {
      haptics.tap()
      logAction({kind, action: isLiked ? 'remove' : 'add', source})
      try {
        if (isLiked) {
          if (key) updateShadow(key, undefined, view)
          await queueToggle(false)
        } else {
          if (key) updateShadow(key, 'pending', view)
          firstActionWelcome.onCreate()
          await queueToggle(true)
          sendFeedback?.('app.bsky.feed.defs#interactionLike')
        }
      } catch (e) {
        // A newer toggle replaced this one.
        if ((e as Error)?.name === 'AbortError') return
        if (!isNetworkError(e)) {
          logger.error(`Failed to update Atmosphere ${kind}`, {
            safeMessage: e,
          })
        }
        let message: string
        switch (kind) {
          case 'recommend':
            message = l({
              message: 'Couldn’t update your recommendation',
              context: 'toast',
            })
            break
          case 'favorite':
            message = l({
              message: 'Couldn’t update your favorite',
              context: 'toast',
            })
            break
          case 'subscribe':
            message = l({
              message: 'Couldn’t update your subscription',
              context: 'toast',
            })
            break
        }
        Toast.show(message, {type: 'error'})
      }
    })

  return {
    /*
     * Signed-in views always carry `viewer` unless the appview failed to look
     * up the viewer's like, and liking then could create a duplicate.
     */
    canLike: !!subjectUri && (!did || !!view.viewer),
    isLiked,
    likeCount,
    toggle,
    firstActionWelcomeDialogControl: firstActionWelcome.control,
  }
}
