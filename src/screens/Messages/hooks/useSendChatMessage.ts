import {useCallback} from 'react'
import {
  type $Typed,
  type AppBskyEmbedRecord,
  AppBskyRichtextFacet,
  RichText,
} from '@atproto/api'

import {shortenLinks, stripInvalidMentions} from '#/lib/strings/rich-text-manip'
import {
  convertBskyAppUrlIfNeeded,
  isBskyPostUrl,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {isConvoActive} from '#/state/messages/convo'
import {type ConvoState} from '#/state/messages/convo/types'
import {useGetPost} from '#/state/queries/post'
import {useAgent} from '#/state/session'

/**
 * Returns a `sendMessage(text)` callback that performs the DM send pipeline:
 * facet detection, optional quote-post embed extraction, link/mention cleanup,
 * and finally `convoState.sendMessage`.
 *
 * The composer is disabled at the UI level when the convo isn't active, so
 * the early `isConvoActive` return below is just a type guard for narrowing
 * `convoState.sendMessage` from `undefined` to a callable.
 */
export function useSendChatMessage({
  convoState,
  embedUri,
  hasScrolled,
  setHasScrolled,
}: {
  convoState: ConvoState
  embedUri: string | undefined
  hasScrolled: boolean
  setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const agent = useAgent()
  const getPost = useGetPost()

  return useCallback(
    async (text: string) => {
      if (!isConvoActive(convoState)) return

      let rt = new RichText({text: text.trimEnd()}, {cleanNewlines: true})

      // detect facets without resolution first - this is used to see if there's
      // any post links in the text that we can embed. We do this first because
      // we want to remove the post link from the text, re-trim, then detect facets
      rt.detectFacetsWithoutResolution()

      let embed: $Typed<AppBskyEmbedRecord.Main> | undefined

      if (embedUri) {
        try {
          const post = await getPost({uri: embedUri})
          if (post) {
            embed = {
              $type: 'app.bsky.embed.record',
              record: {
                uri: post.uri,
                cid: post.cid,
              },
            }

            // look for the embed uri in the facets, so we can remove it from the text
            const postLinkFacet = rt.facets?.find(facet => {
              return facet.features.find(feature => {
                if (AppBskyRichtextFacet.isLink(feature)) {
                  if (isBskyPostUrl(feature.uri)) {
                    const url = convertBskyAppUrlIfNeeded(feature.uri)
                    const [_0, _1, _2, rkey] = url.split('/').filter(Boolean)

                    // this might have a handle instead of a DID
                    // so just compare the rkey - not particularly dangerous
                    return post.uri.endsWith(rkey)
                  }
                }
                return false
              })
            })

            if (postLinkFacet) {
              const isAtStart = postLinkFacet.index.byteStart === 0
              const isAtEnd =
                postLinkFacet.index.byteEnd === rt.unicodeText.graphemeLength

              // remove the post link from the text
              if (isAtStart || isAtEnd) {
                rt.delete(
                  postLinkFacet.index.byteStart,
                  postLinkFacet.index.byteEnd,
                )
              }

              rt = new RichText({text: rt.text.trim()}, {cleanNewlines: true})
            }
          }
        } catch (error) {
          logger.error('Failed to get post as quote for DM', {error})
        }
      }

      await rt.detectFacets(agent)

      rt = shortenLinks(rt)
      rt = stripInvalidMentions(rt)

      if (!hasScrolled) {
        setHasScrolled(true)
      }

      convoState.sendMessage({
        text: rt.text,
        facets: rt.facets,
        embed,
      })
    },
    [agent, convoState, embedUri, getPost, hasScrolled, setHasScrolled],
  )
}
