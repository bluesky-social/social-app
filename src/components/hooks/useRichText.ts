import {useEffect, useState} from 'react'
import {RichText as RichTextAPI} from '@bsky.app/sdk/richtext'

import {usePdsClient} from '#/state/session'

export function useRichText(text: string): [RichTextAPI, boolean] {
  const [prevText, setPrevText] = useState(text)
  const [rawRT, setRawRT] = useState(() => new RichTextAPI({text}))
  const [resolvedRT, setResolvedRT] = useState<RichTextAPI | null>(null)
  /*
   * Facet detection resolves handles via `com.atproto.identity.resolveHandle`,
   * which the account (PDS) client serves. We standardize on the account client
   * where a session is in scope (design section B). Logged out, this is the
   * throwing client; `detectFacets` will reject, and the raw (unresolved)
   * RichText is returned in the meantime.
   */
  const client = usePdsClient()
  if (text !== prevText) {
    setPrevText(text)
    setRawRT(new RichTextAPI({text}))
    setResolvedRT(null)
    // This will queue an immediate re-render
  }
  useEffect(() => {
    let ignore = false
    async function resolveRTFacets() {
      // new each time
      const resolvedRT = new RichTextAPI({text})
      await resolvedRT.detectFacets(client)
      if (!ignore) {
        setResolvedRT(resolvedRT)
      }
    }
    resolveRTFacets()
    return () => {
      ignore = true
    }
  }, [text, client])
  const isResolving = resolvedRT === null
  return [resolvedRT ?? rawRT, isResolving]
}
