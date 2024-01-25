import {useState, useEffect} from 'react'
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
import {ComposerOpts} from 'state/shell/composer'
import {POST_IMG_MAX} from 'lib/constants'
import {logger} from '#/logger'
import {getAgent} from '#/state/session'
import {useGetPost} from '#/state/queries/post'
import {useFetchDid} from '#/state/queries/handle'

export function useExternalLinkFetch({
  setQuote,
}: {
  setQuote: (opts: ComposerOpts['quote']) => void
}) {
  const [extLink, setExtLink] = useState<apilib.ExternalEmbedDraft | undefined>(
    undefined,
  )
  const getPost = useGetPost()
  const fetchDid = useFetchDid()

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
        getPostAsQuote(getPost, extLink.uri).then(
          newQuote => {
            if (aborted) {
              return
            }
            setQuote(newQuote)
            setExtLink(undefined)
          },
          err => {
            logger.error('Failed to fetch post for quote embedding', {
              error: err.toString(),
            })
            setExtLink(undefined)
          },
        )
      } else if (isBskyCustomFeedUrl(extLink.uri)) {
        getFeedAsEmbed(getAgent(), fetchDid, extLink.uri).then(
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
            logger.error('Failed to fetch feed for embedding', {error: err})
            setExtLink(undefined)
          },
        )
      } else if (isBskyListUrl(extLink.uri)) {
        getListAsEmbed(getAgent(), fetchDid, extLink.uri).then(
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
            logger.error('Failed to fetch list for embedding', {error: err})
            setExtLink(undefined)
          },
        )
      } else {
        getLinkMeta(getAgent(), extLink.uri).then(meta => {
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
            localThumb: localThumb ? new ImageModel(localThumb) : undefined,
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
  }, [extLink, setQuote, getPost, fetchDid])

  return {extLink, setExtLink}
}
