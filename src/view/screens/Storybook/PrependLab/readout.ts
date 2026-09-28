import {useEffect, useState} from 'react'
import {setStringAsync} from 'expo-clipboard'

import {type Theme} from '#/alf'
import * as Toast from '#/components/Toast'
import {type Verdict} from './analysis'
import {type Probe, type ProbeSnapshot} from './probe'

const POLL_MS = 200

/**
 * A fresh probe snapshot every 200ms. Only the always-mounted panel passes
 * `housekeeping`, which also refreshes the anchor's live position and ends
 * finished oscillation episodes.
 */
export function useProbeSnapshot(
  probe: Probe,
  {housekeeping = false}: {housekeeping?: boolean} = {},
): [ProbeSnapshot, () => void] {
  const [snap, setSnap] = useState(() => probe.snapshot())
  useEffect(() => {
    const id = setInterval(() => {
      if (housekeeping) void probe.poll()
      setSnap(probe.snapshot())
    }, POLL_MS)
    return () => clearInterval(id)
  }, [probe, housekeeping])
  return [snap, () => setSnap(probe.snapshot())]
}

export function copyRuns(probe: Probe, which: 'last' | 'all') {
  const runs = which === 'all' ? probe.runs : probe.runs.slice(-1)
  if (!runs.length) return
  void setStringAsync(JSON.stringify(runs, null, 2))
  Toast.show(
    which === 'all'
      ? `Copied ${runs.length} runs as JSON`
      : 'Copied the last run as JSON',
  )
}

export function verdictColor(t: Theme, verdict: Verdict | undefined) {
  switch (verdict) {
    case 'held':
    case 'smooth':
      return t.palette.positive_500
    case 'drifted':
    case 'pushedDown':
    case 'jumped':
    case 'lost':
    case 'oscillating':
      return t.palette.negative_500
    default:
      return t.atoms.text.color
  }
}
