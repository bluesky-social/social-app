import assert from 'node:assert'

import {ChatBskyGroupDefs} from '@atproto/api'
import {type Express} from 'express'

import {type AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {
  getImage,
  handler,
  hideAvatarLabels,
  originVerifyMiddleware,
  renderImage,
} from './util.js'

export default function (ctx: AppContext, app: Express) {
  return app.get(
    '/chat-invite/:code',
    originVerifyMiddleware(ctx),
    handler(async (req, res) => {
      const {code} = req.params
      let preview: ChatBskyGroupDefs.JoinLinkPreviewView
      try {
        const result = await ctx.chatAgent.chat.bsky.group.getJoinLinkPreviews({
          codes: [code],
        })
        const found = result.data.joinLinkPreviews[0]
        if (!ChatBskyGroupDefs.isJoinLinkPreviewView(found)) {
          return res.status(404).end('not found')
        }
        preview = found
      } catch (err) {
        httpLogger.warn({err, code}, 'could not fetch chat invite preview')
        return res.status(404).end('not found')
      }

      // Load the owner's avatar (if any, and not labeled).
      let ownerImage: Buffer | null = null
      const owner = preview.owner
      const ownerHasSafeAvatar =
        !!owner.avatar && !owner.labels?.some(l => hideAvatarLabels.has(l.val))
      if (ownerHasSafeAvatar) {
        try {
          assert(owner.avatar)
          ownerImage = await getImage(owner.avatar)
        } catch (err) {
          httpLogger.warn(
            {err, code, did: owner.did},
            'could not fetch owner image',
          )
        }
      }

      const output = await renderImage(ctx, res, {
        kind: 'chat-invite',
        props: {name: preview.name, ownerHandle: owner.handle, ownerImage},
      })
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      res.setHeader('cdn-tag', owner.did)
      return res.end(output)
    }),
  )
}
