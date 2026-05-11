import {useCallback} from 'react'

import {getEmojis} from './getEmojis'

let emojis: Awaited<ReturnType<typeof getEmojis>> | null = null

export function useGetEmojis() {
  return useCallback(async () => {
    emojis ??= await getEmojis()
    return emojis
  }, [])
}
