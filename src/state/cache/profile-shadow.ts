import {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import EventEmitter from 'eventemitter3'
import {AppBskyActorDefs} from '@atproto/api'
import {Shadow} from './types'
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

export function useProfileShadow(
  profile: ProfileView,
  ifAfterTS: number,
): Shadow<ProfileView> {
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

  return useMemo(() => {
    return state.ts > ifAfterTS
      ? mergeShadow(profile, state.value)
      : {...profile, isShadowed: true}
  }, [profile, state, ifAfterTS])
}

export function updateProfileShadow(
  uri: string,
  value: Partial<ProfileShadow>,
) {
  emitter.emit(uri, value)
}

export function isProfileShadowed<T extends ProfileView>(
  v: T | Shadow<T>,
): v is Shadow<T> {
  return 'isShadowed' in v && !!v.isShadowed
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
  return {
    ...profile,
    viewer: {
      ...(profile.viewer || {}),
      following: shadow.followingUri,
      muted: shadow.muted,
      blocking: shadow.blockingUri,
    },
    isShadowed: true,
  }
}
