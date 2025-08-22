import { CHAT_PROXY_DID } from '#/env'

export const DM_SERVICE_HEADERS = {
  'atproto-proxy': `${CHAT_PROXY_DID}#gndr_chat`,
}
