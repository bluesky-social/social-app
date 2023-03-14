import {useState, useEffect} from 'react'
import {useStores} from 'state/index'
import * as apilib from 'lib/api/index'
import {getLinkMeta} from 'lib/link-meta/link-meta'
import {getPostAsQuote} from 'lib/link-meta/bsky'
import {downloadAndResize} from 'lib/media/manip'
import {isBskyPostUrl} from 'lib/strings/url-helpers'
import {ComposerOpts} from 'state/models/ui/shell'

export function useExternalLinkFetch({
  setQuote,
}: {
  setQuote: (opts: ComposerOpts['quote']) => void
}) {
  const store = useStores()
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
      if (isBskyPostUrl(extLink.uri)) {
        getPostAsQuote(store, extLink.uri).then(
          newQuote => {
            if (aborted) {
              return
            }
            setQuote(newQuote)
            setExtLink(undefined)
          },
          err => {
            store.log.error('Failed to fetch post for quote embedding', {err})
            setExtLink(undefined)
          },
        )
      } else {
        getLinkMeta(store, extLink.uri).then(meta => {
          if (aborted) {
            return
          }
          setExtLink({
            uri: extLink.uri,
            isLoading: !!meta.image,
            meta,
          })
        })
      }
      return cleanup
    }
    if (extLink.isLoading && extLink.meta?.image && !extLink.localThumb) {
      console.log('attempting download')
      downloadAndResize({
        uri: extLink.meta.image,
        width: 2000,
        height: 2000,
        mode: 'contain',
        maxSize: 1000000,
        timeout: 15e3,
      })
        .catch(() => undefined)
        .then(localThumb => {
          if (aborted) {
            return
          }
          setExtLink({
            ...extLink,
            isLoading: false, // done
            localThumb,
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
  }, [store, extLink, setQuote])

  return {extLink, setExtLink}
}
