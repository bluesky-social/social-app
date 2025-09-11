import {AppBskyFeedPost, AtUri} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import {Express} from 'express'
import satori from 'satori'

import {Post} from '../components/Post/index.js'
import {AppContext} from '../context.js'
import {getModeratorData} from '../data/getModeratorData.js'
import {getPost} from '../data/getPost.js'
import {getPostData} from '../data/getPostData.js'
import {httpLogger} from '../logger.js'
import {loadEmojiAsSvg} from '../util.js'
import {
  getRenderOptions,
  parseDisplayOptionsFromQuery,
} from '../util/postDisplayOptions.js'
import {handler, originVerifyMiddleware} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/profile/:actor/post/:rkey',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      let {actor, rkey} = req.params
      let uri = AtUri.make(actor, 'app.bsky.feed.post', rkey)

      try {
        const post = await getPost({
          uri,
          agent: ctx.appviewAgent,
        })

        if (!AppBskyFeedPost.isRecord(post.record)) {
          return res.status(404).end('not found')
        }
        const notPublic = post.author.labels.some(
          l => l.val === `!no-unauthenticated`,
        )
        if (notPublic) {
          return res.status(404).end('not found')
        }

        const [postData, moderatorData] = await Promise.all([
          /*
           * Fetch any remote post data, like images and their metadata.
           */
          getPostData(post),
          /*
           * Fetches labeler definitions and builds `moderationOpts`
           */
          getModeratorData(ctx.appviewAgent),
        ])
        const displayOptions = parseDisplayOptionsFromQuery(req.query)
        const {width} = getRenderOptions(displayOptions)

        const svg = await satori(
          <Post
            post={post}
            data={postData}
            moderatorData={moderatorData}
            displayOptions={displayOptions}
          />,
          {
            fonts: ctx.fonts,
            width,
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
            value: width * 2,
          },
          // logLevel: 'trace',
        })

        res.statusCode = 200
        res.setHeader('content-type', 'image/png')
        res.setHeader('cdn-tag', [...postData.images.keys()].join(','))

        return res.end(output.asPng())
      } catch (err) {
        httpLogger.warn(
          {err, uri: uri.toString()},
          `Failed to render post ${uri}`,
        )
        return res.status(404).end('not found')
      }
    }),
  )
}
