import {useMemo} from 'react'

import {type Nux, useNux, useSaveNux} from '#/state/queries/nuxs'

export type AnnouncementState = {
  completed: boolean
  complete: () => void
}

export function useAnnouncementState({id}: {id: Nux}) {
  const nux = useNux(id)
  const {mutate: save, variables} = useSaveNux()
  return useMemo(() => {
    /**
     * Until data has loaded, assumed completed
     */
    let completed = nux.status === 'ready' ? nux.nux?.completed === true : true

    if (variables?.completed) {
      completed = true
    }

    return {
      completed,
      complete() {
        save({
          id,
          completed: true,
          data: undefined,
        })
      },
    }
  }, [id, nux, save, variables])
}
