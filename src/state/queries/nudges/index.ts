import {useCallback, useMemo} from 'react'

import {pack, unpack} from '#/state/queries/nudges/compression'
import {type Flag, flagKeys, flags} from '#/state/queries/nudges/flags'

export function useNudges() {
  const data = pack(flags) // TODO fetch from API

  return useMemo(() => {
    return data ? unpack(data, flagKeys) : flags
  }, [data])
}

export function useNudge(flag: Flag) {
  const nudges = useNudges()

  const complete = useCallback(() => {
    const next = {...nudges}
    next[flag] = true
    pack(next) // TODO write to API
  }, [flag, nudges])

  const reset = useCallback(() => {
    const next = {...nudges}
    next[flag] = false
    pack(next) // TODO write to API
  }, [flag, nudges])

  return useMemo(
    () => ({
      nudge: nudges[flag],
      complete,
      reset,
    }),
    [flag, nudges, complete, reset],
  )
}
