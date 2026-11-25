import {useLingui} from '@lingui/react/macro'

import {useSetTitle} from '#/lib/hooks/useSetTitle'
import {isInvalidHandle} from '#/lib/strings/handles'

/**
 * Post routes title themselves from the URL's handle-or-DID. Once the author
 * is known, prefer their handle, but keep the route title over
 * "handle.invalid".
 */
export function useSetPostTitle(author?: {handle: string}) {
  const {t: l} = useLingui()
  useSetTitle(
    author && !isInvalidHandle(author.handle)
      ? l`Post by @${author.handle}`
      : undefined,
  )
}
