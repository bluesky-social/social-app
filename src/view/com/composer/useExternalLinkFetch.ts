import {useState, useEffect} from 'react'
import {useStores} from 'state/index'
import {ImageModel} from 'state/models/media/image'
import * as apilib from 'lib/api/index'
import {getLinkMeta} from 'lib/link-meta/link-meta'
import {
  getPostAsQuote,
  getFeedAsEmbed,
  getListAsEmbed,
} from 'lib/link-meta/bsky'
import {downloadAndResize} from 'lib/media/manip'
import {
  isBskyPostUrl,
  isBskyCustomFeedUrl,
  isBskyListUrl,
} from 'lib/strings/url-helpers'
import {ComposerOpts} from 'state/models/ui/shell'
import {POST_IMG_MAX} from 'lib/constants'

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
            store.log.error('Failed to fetch post for quote embedding', {
              error: err,
            })
            setExtLink(undefined)
          },
        )
      } else if (isBskyCustomFeedUrl(extLink.uri)) {
        getFeedAsEmbed(store, extLink.uri).then(
          ({embed, meta}) => {
            if (aborted) {
              return
            }
            setExtLink({
              uri: extLink.uri,
              isLoading: false,
              meta,
              embed,
            })
          },
          err => {
            store.log.error('Failed to fetch feed for embedding', {error: err})
            setExtLink(undefined)
          },
        )
      } else if (isBskyListUrl(extLink.uri)) {
        getListAsEmbed(store, extLink.uri).then(
          ({embed, meta}) => {
            if (aborted) {
              return
            }
            setExtLink({
              uri: extLink.uri,
              isLoading: false,
              meta,
              embed,
            })
          },
          err => {
            store.log.error('Failed to fetch list for embedding', {error: err})
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
      downloadAndResize({
        uri: extLink.meta.image,
        width: POST_IMG_MAX.width,
        height: POST_IMG_MAX.height,
        mode: 'contain',
        maxSize: POST_IMG_MAX.size,
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
            localThumb: localThumb
              ? new ImageModel(store, localThumb)
              : undefined,
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
