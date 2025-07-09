import {useEffect, useState} from 'react'
import type tldts from 'tldts'

export function useTLDs() {
  const [tlds, setTlds] = useState<typeof tldts>()

  useEffect(() => {
    // @ts-expect-error - valid path
    import('tldts/dist/index.cjs.min.js').then(tlds => {
      setTlds(tlds)
    })
  }, [])

  return tlds
}
