import {useEffect, useState} from 'react'

import {useAgent} from '#/state/session'
import * as apilib from 'lib/api/index'
import {getLinkMeta} from 'lib/link-meta/link-meta'
import {ComposerOpts} from 'state/shell/composer'

export function useExternalLinkFetch({}: {
  setQuote: (opts: ComposerOpts['quote']) => void
}) {
  const agent = useAgent()
  const [extLink, setExtLink] = useState<apilib.ExternalEmbedDraft | undefined>(
    undefined,
  )

  useEffect(() => {
    let aborted = false
    const cleanup = () => {
      aborted = true
    }
    if (!extLink) {
      return cleanup
    }
    if (!extLink.meta) {
      getLinkMeta(agent, extLink.uri).then(meta => {
        if (aborted) {
          return
        }
        setExtLink({
          uri: extLink.uri,
          isLoading: !!meta.image,
          meta,
        })
      })
      return cleanup
    }
    if (extLink.isLoading) {
      setExtLink({
        ...extLink,
        isLoading: false, // done
      })
    }
    return cleanup
  }, [extLink, agent])

  return {extLink, setExtLink}
}
