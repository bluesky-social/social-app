import resvg from '@resvg/resvg-js'
import satori from 'satori'

import {
  AVATAR_BUBBLES_SIZE,
  AvatarBubbles,
} from '../components/AvatarBubbles.js'
import {
  CHAT_INVITE_HEIGHT,
  CHAT_INVITE_WIDTH,
  ChatInvite,
} from '../components/ChatInvite.js'
import {
  STARTERPACK_HEIGHT,
  STARTERPACK_WIDTH,
  StarterPack,
} from '../components/StarterPack.js'
import {loadEmojiAsSvg} from '../util.js'
import {type RenderFont} from './fonts.js'
import {type RenderJob, type RenderStage} from './protocol.js'

/** This module is imported only by the disposable renderer process. */
export async function render(
  job: RenderJob,
  fonts: RenderFont[],
  stage: (value: RenderStage) => void,
) {
  let element: React.ReactNode
  let width: number
  let height: number
  switch (job.kind) {
    case 'starter-pack':
      element = <StarterPack {...job.props} />
      width = STARTERPACK_WIDTH
      height = STARTERPACK_HEIGHT
      break
    case 'chat-invite':
      element = <ChatInvite {...job.props} />
      width = CHAT_INVITE_WIDTH
      height = CHAT_INVITE_HEIGHT
      break
    case 'avatar-bubbles':
      element = <AvatarBubbles {...job.props} />
      width = height = AVATAR_BUBBLES_SIZE
      break
  }
  stage('satori')
  const svg = await satori(element, {
    fonts,
    width,
    height,
    loadAdditionalAsset:
      job.kind === 'avatar-bubbles'
        ? undefined
        : async (code, text) => {
            return code === 'emoji' ? ((await loadEmojiAsSvg(text)) ?? '') : ''
          },
  })
  stage('resvg')
  return (await resvg.renderAsync(svg)).asPng()
}
