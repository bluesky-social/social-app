import {useMemo, useCallback} from 'react'

import {flags, flagKeys, Flag} from '#/state/queries/nudges/flags'
import {pack, unpack} from '#/state/queries/nudges/compression'

const TEST = pack(flags)

export function useNudges() {
  const data = TEST // TODO
  return useMemo(() => {
    return data ? unpack(data, flagKeys) : flags
  }, [data])
}

export function useNudgesGroup() {
  // TODO
}

export function useNudge(flag: Flag) {
  const nudges = useNudges()
  const nudge = nudges[flag]
  const complete = useCallback(() => {
    const next = {...nudges}
    next[flag] = true
    const data = pack(next)
    // TODO update
  }, [nudge])
  const reset = useCallback(() => {
    const next = {...nudges}
    next[flag] = false
    const data = pack(next)
    // TODO update
  }, [nudge])
  return useMemo(() => ({
  }), [nudge, complete, reset])
}
