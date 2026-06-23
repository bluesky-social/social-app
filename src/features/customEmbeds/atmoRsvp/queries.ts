import {AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent, useSession} from '#/state/session'
import * as Toast from '#/components/Toast'
import {
  type AtmoEventResponse,
  getAtmoEvent,
  listViewerRsvps,
} from '#/features/customEmbeds/atmoRsvp/api'
import {
  EVENT_COLLECTION,
  RSVP_COLLECTION,
  RSVP_STATUS,
  type RsvpStatus,
  rsvpStatusFromToken,
} from '#/features/customEmbeds/atmoRsvp/lexicon'

export type ViewerRsvp = {
  uri: string
  rkey: string
  status: RsvpStatus | null
}

const eventQueryKey = (actor: string, rkey: string) =>
  ['atmoRsvp', 'event', actor, rkey] as const
const viewerQueryKey = (did: string | undefined, eventUri: string) =>
  ['atmoRsvp', 'viewerRsvp', did, eventUri] as const

export function useAtmoEventQuery({
  actor,
  rkey,
  enabled = true,
}: {
  actor: string
  rkey: string
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery({
    queryKey: eventQueryKey(actor, rkey),
    enabled: enabled && !!actor && !!rkey,
    queryFn: async ({signal}) => {
      let did = actor
      if (!did.startsWith('did:')) {
        const res = await agent.resolveHandle({handle: actor})
        did = res.data.did
      }
      const eventUri = `at://${did}/${EVENT_COLLECTION}/${rkey}`
      return getAtmoEvent(eventUri, {signal})
    },
    staleTime: STALE.MINUTES.ONE,
  })
}

/**
 * Reads the viewer's RSVP for this event via atmo's `subjectUri`-filtered
 * listRecords (a targeted lookup, no client-side scan). atmo indexes RSVPs off
 * the firehose so this can briefly lag right after a write, but the mutation
 * writes the authoritative result into the cache and doesn't invalidate this
 * query, so the button stays correct without re-reading during that window.
 */
export function useViewerRsvpQuery({
  eventUri,
  enabled = true,
}: {
  eventUri?: string
  enabled?: boolean
}) {
  const {currentAccount} = useSession()
  const did = currentAccount?.did
  return useQuery<ViewerRsvp | null>({
    queryKey: viewerQueryKey(did, eventUri ?? ''),
    enabled: !!did && !!eventUri && enabled,
    queryFn: async ({signal}) => {
      const res = await listViewerRsvps(
        {actor: did!, subjectUri: eventUri!},
        {signal},
      )
      const record = res.records?.[0]
      if (!record) return null
      return {
        uri: record.uri,
        rkey: new AtUri(record.uri).rkey,
        status: rsvpStatusFromToken(record.value?.status),
      }
    },
    staleTime: STALE.MINUTES.ONE,
  })
}

export function useRsvpMutation({
  actor,
  rkey,
  eventUri,
  eventCid,
}: {
  actor: string
  rkey: string
  eventUri: string
  eventCid: string
}) {
  const agent = useAgent()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()
  const {_} = useLingui()
  const did = currentAccount?.did
  const viewerKey = viewerQueryKey(did, eventUri)
  const eventKey = eventQueryKey(actor, rkey)

  return useMutation<ViewerRsvp | null, Error, RsvpStatus | null>({
    mutationFn: async next => {
      if (!did) throw new Error('Not signed in')
      const current = queryClient.getQueryData<ViewerRsvp | null>(viewerKey)

      if (next === null) {
        if (current?.rkey) {
          await agent.com.atproto.repo.deleteRecord({
            repo: did,
            collection: RSVP_COLLECTION,
            rkey: current.rkey,
          })
        }
        return null
      }

      const record = {
        $type: RSVP_COLLECTION,
        status: RSVP_STATUS[next],
        subject: {uri: eventUri, cid: eventCid},
        createdAt: new Date().toISOString(),
      }

      if (current?.rkey) {
        const res = await agent.com.atproto.repo.putRecord({
          repo: did,
          collection: RSVP_COLLECTION,
          rkey: current.rkey,
          record,
        })
        return {uri: res.data.uri, rkey: current.rkey, status: next}
      }

      const res = await agent.com.atproto.repo.createRecord({
        repo: did,
        collection: RSVP_COLLECTION,
        record,
      })
      return {
        uri: res.data.uri,
        rkey: new AtUri(res.data.uri).rkey,
        status: next,
      }
    },
    onMutate: async next => {
      await queryClient.cancelQueries({queryKey: viewerKey})
      const prevViewer = queryClient.getQueryData<ViewerRsvp | null>(viewerKey)
      const prevEvent = queryClient.getQueryData<AtmoEventResponse>(eventKey)

      queryClient.setQueryData<ViewerRsvp | null>(viewerKey, old =>
        next === null
          ? null
          : {uri: old?.uri ?? '', rkey: old?.rkey ?? '', status: next},
      )

      // Optimistically reflect the change in the going count.
      const delta =
        (next === 'going' ? 1 : 0) - (prevViewer?.status === 'going' ? 1 : 0)
      if (delta !== 0 && prevEvent) {
        queryClient.setQueryData<AtmoEventResponse>(eventKey, old =>
          old
            ? {
                ...old,
                rsvpsGoingCount: Math.max(
                  0,
                  (old.rsvpsGoingCount ?? 0) + delta,
                ),
              }
            : old,
        )
      }

      return {prevViewer, prevEvent}
    },
    onError: (_err, _next, context) => {
      const ctx = context as
        | {prevViewer?: ViewerRsvp | null; prevEvent?: AtmoEventResponse}
        | undefined
      if (ctx && 'prevViewer' in ctx) {
        queryClient.setQueryData(viewerKey, ctx.prevViewer)
      }
      if (ctx && 'prevEvent' in ctx) {
        queryClient.setQueryData(eventKey, ctx.prevEvent)
      }
      Toast.show(_(msg`Couldn't update your RSVP`), {type: 'error'})
    },
    onSuccess: result => {
      // Write through the authoritative record so the button stays correct
      // without re-reading from a possibly-lagging index.
      queryClient.setQueryData<ViewerRsvp | null>(viewerKey, result)
    },
  })
}
