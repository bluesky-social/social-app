import {useEffect, useState, useMemo, useCallback} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyActorDefs} from '@atproto/api'
import {batchedUpdates} from '#/lib/batchedUpdates'
import {Shadow, castAsShadow} from './types'
export type {Shadow} from './types'

const emitter = new EventEmitter()

export interface ProfileShadow {
  followingUri: string | undefined
  muted: boolean | undefined
  blockingUri: string | undefined
}

interface CacheEntry {
  ts: number
  value: ProfileShadow
}

type ProfileView =
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileViewDetailed

const firstSeenMap = new WeakMap<ProfileView, number>()
function getFirstSeenTS(profile: ProfileView): number {
  let timeStamp = firstSeenMap.get(profile)
  if (timeStamp !== undefined) {
    return timeStamp
  }
  timeStamp = Date.now()
  firstSeenMap.set(profile, timeStamp)
  return timeStamp
}

export function useProfileShadow(profile: ProfileView): Shadow<ProfileView> {
  const profileSeenTS = getFirstSeenTS(profile)
  const [state, setState] = useState<CacheEntry>(() => ({
    ts: profileSeenTS,
    value: fromProfile(profile),
  }))

  const [prevProfile, setPrevProfile] = useState(profile)
  if (profile !== prevProfile) {
    // if we got a new prop, assume it's fresher
    // than whatever shadow state we accumulated
    setPrevProfile(profile)
    setState({
      ts: profileSeenTS,
      value: fromProfile(profile),
    })
  }

  const onUpdate = useCallback(
    (value: Partial<ProfileShadow>) => {
      setState(s => ({ts: Date.now(), value: {...s.value, ...value}}))
    },
    [setState],
  )

  // react to shadow updates
  useEffect(() => {
    emitter.addListener(profile.did, onUpdate)
    return () => {
      emitter.removeListener(profile.did, onUpdate)
    }
  }, [profile.did, onUpdate])

  return useMemo(() => {
    return state.ts > profileSeenTS
      ? mergeShadow(profile, state.value)
      : castAsShadow(profile)
  }, [profile, state, profileSeenTS])
}

export function updateProfileShadow(
  uri: string,
  value: Partial<ProfileShadow>,
) {
  batchedUpdates(() => {
    emitter.emit(uri, value)
  })
}

function fromProfile(profile: ProfileView): ProfileShadow {
  return {
    followingUri: profile.viewer?.following,
    muted: profile.viewer?.muted,
    blockingUri: profile.viewer?.blocking,
  }
}

function mergeShadow(
  profile: ProfileView,
  shadow: ProfileShadow,
): Shadow<ProfileView> {
  return castAsShadow({
    ...profile,
    viewer: {
      ...(profile.viewer || {}),
      following: shadow.followingUri,
      muted: shadow.muted,
      blocking: shadow.blockingUri,
    },
  })
}
