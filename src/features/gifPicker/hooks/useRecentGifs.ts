import {useSession} from '#/state/session'
import {type Gif} from '#/features/gifPicker/types'
import {account} from '#/storage'

const MAX_RECENT_GIFS = 20

function readValid(did: string): Gif[] {
  const stored = account.get([did, 'recentGifs']) ?? []
  // Earlier builds of this branch stored recents as JSON-serialized strings.
  // Drop any malformed entries so a dev with stale local data doesn't crash.
  if (stored.some(item => typeof item !== 'object' || item === null)) {
    account.remove([did, 'recentGifs'])
    return []
  }
  return stored
}

export function useRecentGifs() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  const getRecents = (): Gif[] => {
    if (!did) return []
    return readValid(did)
  }

  const addRecent = (gif: Gif) => {
    if (!did) return
    const existing = readValid(did)
    const deduped = existing.filter(g => g.id !== gif.id)
    const updated = [gif, ...deduped].slice(0, MAX_RECENT_GIFS)
    account.set([did, 'recentGifs'], updated)
  }

  return {
    getRecents,
    addRecent,
    hasRecents: did ? readValid(did).length > 0 : false,
  }
}
