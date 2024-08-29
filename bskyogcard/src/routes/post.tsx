import React from 'react'
import {AppBskyFeedPost, AtUri} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import {Express} from 'express'
import satori from 'satori'

import {Post} from '../components/Post.js'
import {AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {loadEmojiAsSvg} from '../util.js'
import {getModerationOptions, moderatePost} from '../util/moderation.js'
import {resolvePostData} from '../util/resolvePostData.js'
import {handler, originVerifyMiddleware} from './util.js'

const WIDTH = 600

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/:actor/post/:rkey',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      let {actor, rkey} = req.params
      let uri = AtUri.make(actor, 'app.bsky.feed.post', rkey)

      try {
        if (!actor.startsWith('did:')) {
          const res = await ctx.appviewAgent.resolveHandle({
            handle: actor,
          })
          actor = res.data.did
        }
        uri = AtUri.make(actor, 'app.bsky.feed.post', rkey)
        const {data} = await ctx.appviewAgent.getPosts({
          uris: [uri.toString()],
        })
        const post = data.posts.at(0)

        if (!AppBskyFeedPost.isRecord(post.record)) {
          return res.status(404).end('not found')
        }
        const notPublic = post.author.labels.some(
          l => l.val === `!no-unauthenticated`,
        )
        if (notPublic) {
          return res.status(404).end('not found')
        }

        const [postData, moderationOptions] = await Promise.all([
          resolvePostData(post, ctx.appviewAgent),
          getModerationOptions(ctx.appviewAgent),
        ])

        const svg = await satori(
          <Post
            post={post}
            data={postData}
            moderation={moderatePost(post, moderationOptions)}
          />,
          {
            fonts: ctx.fonts,
            width: WIDTH,
            loadAdditionalAsset: async (code, text) => {
              if (code === 'emoji') {
                return await loadEmojiAsSvg(text)
              }
            },
          },
        )
        const output = await resvg.renderAsync(svg, {
          fitTo: {
            mode: 'width',
            value: WIDTH * 2,
          },
          logLevel: 'trace',
        })

        res.statusCode = 200
        res.setHeader('content-type', 'image/png')
        res.setHeader('cdn-tag', [...postData.images.keys()].join(','))

        return res.end(output.asPng())
      } catch (err) {
        httpLogger.warn({err, uri: uri.toString()}, 'could not fetch post')
        return res.status(404).end('not found')
      }
    }),
  )
}
