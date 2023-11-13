import {useEffect, useState, useCallback, useRef} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyActorDefs} from '@atproto/api'

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

export function useProfileShadow<T extends ProfileView>(
  profile: T,
  ifAfterTS: number,
): T {
  const [state, setState] = useState<CacheEntry>({
    ts: Date.now(),
    value: fromProfile(profile),
  })
  const firstRun = useRef(true)

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

  // react to profile updates
  useEffect(() => {
    // dont fire on first run to avoid needless re-renders
    if (!firstRun.current) {
      setState({ts: Date.now(), value: fromProfile(profile)})
    }
    firstRun.current = false
  }, [profile])

  return state.ts > ifAfterTS ? mergeShadow(profile, state.value) : profile
}

export function updateProfileShadow(
  uri: string,
  value: Partial<ProfileShadow>,
) {
  emitter.emit(uri, value)
}

function fromProfile(profile: ProfileView): ProfileShadow {
  return {
    followingUri: profile.viewer?.following,
    muted: profile.viewer?.muted,
    blockingUri: profile.viewer?.blocking,
  }
}

function mergeShadow<T extends ProfileView>(
  profile: T,
  shadow: ProfileShadow,
): T {
  return {
    ...profile,
    viewer: {
      ...(profile.viewer || {}),
      following: shadow.followingUri,
      muted: shadow.muted,
      blocking: shadow.blockingUri,
    },
  }
}
