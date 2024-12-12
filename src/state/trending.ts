import React from 'react'

import * as persisted from '#/state/persisted'

// TODO only updates in other tabs, not current one
export function useTrendingTopicsSidebarSetting() {
  const [_show, setShow] = React.useState(
    () => !persisted.get('hideSidebarTrendingTopics'),
  )

  const set = React.useCallback(
    (show: boolean) => {
      setShow(show)
      persisted.write('hideSidebarTrendingTopics', !show)
    },
    [setShow],
  )

  // persisted.write('hideSidebarTrendingTopics', undefined)

  React.useEffect(() => {
    return persisted.onUpdate('hideSidebarTrendingTopics', value => {
      setShow(!value)
    })
  }, [setShow])

  return [_show, set] as const
}
