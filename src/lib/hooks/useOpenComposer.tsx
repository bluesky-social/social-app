import {useMemo} from 'react'
import {Trans} from '@lingui/macro'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {useOpenComposer as rootUseOpenComposer} from '#/state/shell/composer'

export function useOpenComposer() {
  const {openComposer} = rootUseOpenComposer()
  const requireEmailVerification = useRequireEmailVerification()
  return useMemo(() => {
    return {
      openComposer: requireEmailVerification(openComposer, {
        instructions: [
          <Trans key="pre-compose">
            Before creating a post or replying, you must first verify your
            email.
          </Trans>,
        ],
      }),
    }
  }, [openComposer, requireEmailVerification])
}
