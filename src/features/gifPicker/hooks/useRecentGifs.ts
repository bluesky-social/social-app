import {useSession} from '#/state/session'
import {type Gif} from '#/features/gifPicker/types'
import {account} from '#/storage'

const MAX_RECENT_GIFS = 20

export function useRecentGifs() {
  const {currentAccount} = useSession()
  const did = currentAccount?.did

  const getRecents = (): Gif[] => {
    if (!did) return []
    const stored = account.get([did, 'recentGifs'])
    if (!stored) return []
    try {
      return stored.map(s => JSON.parse(s) as Gif)
    } catch {
      return []
    }
  }

  const addRecent = (gif: Gif) => {
    if (!did) return
    const stored = account.get([did, 'recentGifs']) ?? []
    // Remove duplicate if already in recents
    const filtered = stored.filter(s => {
      try {
        return (JSON.parse(s) as Gif).id !== gif.id
      } catch {
        return true
      }
    })
    // Prepend and cap
    const updated = [JSON.stringify(gif), ...filtered].slice(0, MAX_RECENT_GIFS)
    account.set([did, 'recentGifs'], updated)
  }

  return {
    getRecents,
    addRecent,
    hasRecents: did
      ? (account.get([did, 'recentGifs'])?.length ?? 0) > 0
      : false,
  }
}
