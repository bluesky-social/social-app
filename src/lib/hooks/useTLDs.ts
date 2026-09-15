import {useEffect, useState} from 'react'
import type tldts from 'tldts'

/**
 * Module scope because React Compiler cannot lower an `import()` expression
 * inside a component or hook body.
 */
function loadTLDs(): Promise<typeof tldts> {
  // @ts-expect-error - valid path
  return import('tldts/dist/index.cjs.min.js')
}

export function useTLDs() {
  const [tlds, setTlds] = useState<typeof tldts>()

  useEffect(() => {
    loadTLDs().then(setTlds)
  }, [])

  return tlds
}
