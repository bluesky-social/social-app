import assert from 'node:assert'

import {type ChatBskyGroupDefs} from '@atproto/api'
import resvg from '@resvg/resvg-js'
import {type Express} from 'express'
import satori from 'satori'

import {
  CHAT_INVITE_HEIGHT,
  CHAT_INVITE_WIDTH,
  ChatInvite,
} from '../components/ChatInvite.js'
import {type AppContext} from '../context.js'
import {httpLogger} from '../logger.js'
import {loadEmojiAsSvg} from '../util.js'
import {
  getImage,
  handler,
  hideAvatarLabels,
  originVerifyMiddleware,
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
        if (!found) {
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

      const svg = await satori(
        <ChatInvite preview={preview} ownerImage={ownerImage} />,
        {
          fonts: ctx.fonts,
          height: CHAT_INVITE_HEIGHT,
          width: CHAT_INVITE_WIDTH,
          loadAdditionalAsset: async (lang, text) => {
            if (lang === 'emoji') {
              return (await loadEmojiAsSvg(text)) ?? ''
            }
            return ''
          },
        },
      )
      const output = await resvg.renderAsync(svg)
      res.statusCode = 200
      res.setHeader('content-type', 'image/png')
      res.setHeader('cdn-tag', owner.did)
      return res.end(output.asPng())
    }),
  )
}
