import {useEffect, useState} from 'react'

import {logger} from '#/logger'
import {useFetchDid} from '#/state/queries/handle'
import {useGetPost} from '#/state/queries/post'
import {useAgent} from '#/state/session'
import * as apilib from 'lib/api/index'
import {POST_IMG_MAX} from 'lib/constants'
import {
  getFeedAsEmbed,
  getListAsEmbed,
  getPostAsQuote,
  getStarterPackAsEmbed,
} from 'lib/link-meta/bsky'
import {getLinkMeta} from 'lib/link-meta/link-meta'
import {resolveShortLink} from 'lib/link-meta/resolve-short-link'
import {downloadAndResize} from 'lib/media/manip'
import {
  isBskyCustomFeedUrl,
  isBskyListUrl,
  isBskyPostUrl,
  isBskyStarterPackUrl,
  isBskyStartUrl,
  isShortLink,
} from 'lib/strings/url-helpers'
import {ImageModel} from 'state/models/media/image'
import {ComposerOpts} from 'state/shell/composer'

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
  const agent = useAgent()

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
              message: err.toString(),
            })
            setExtLink(undefined)
          },
        )
      } else if (isBskyCustomFeedUrl(extLink.uri)) {
        getFeedAsEmbed(agent, fetchDid, extLink.uri).then(
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
            logger.error('Failed to fetch feed for embedding', {message: err})
            setExtLink(undefined)
          },
        )
      } else if (isBskyListUrl(extLink.uri)) {
        getListAsEmbed(agent, fetchDid, extLink.uri).then(
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
            logger.error('Failed to fetch list for embedding', {message: err})
            setExtLink(undefined)
          },
        )
      } else if (
        isBskyStartUrl(extLink.uri) ||
        isBskyStarterPackUrl(extLink.uri)
      ) {
        getStarterPackAsEmbed(agent, fetchDid, extLink.uri).then(
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
        )
      } else if (isShortLink(extLink.uri)) {
        if (isShortLink(extLink.uri)) {
          resolveShortLink(extLink.uri).then(res => {
            if (res && res !== extLink.uri) {
              setExtLink({
                uri: res,
                isLoading: true,
              })
            }
          })
        }
      } else {
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
  }, [extLink, setQuote, getPost, fetchDid, agent])

  return {extLink, setExtLink}
}
