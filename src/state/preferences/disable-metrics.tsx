import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = {
  likeMetrics: persisted.Schema['disableLikeMetrics']
  repostMetrics: persisted.Schema['disableRepostMetrics']
  quoteMetrics: persisted.Schema['disableQuoteMetrics']
  bookmarkMetrics: persisted.Schema['disableBookmarkMetrics']
  replyMetrics: persisted.Schema['disableReplyMetrics']
}
type SetContext = {
  setLikeMetrics: (v: persisted.Schema['disableLikeMetrics']) => void
  setRepostMetrics: (v: persisted.Schema['disableRepostMetrics']) => void
  setQuoteMetrics: (v: persisted.Schema['disableQuoteMetrics']) => void
  setBookmarkMetrics: (v: persisted.Schema['disableBookmarkMetrics']) => void
  setReplyMetrics: (v: persisted.Schema['disableReplyMetrics']) => void
}

const stateContext = React.createContext<StateContext>({
  likeMetrics: 'show',
  repostMetrics: 'show',
  quoteMetrics: 'show',
  bookmarkMetrics: 'show',
  replyMetrics: 'show',
})
stateContext.displayName = 'MetricStateContext'
const setContext = React.createContext<SetContext>({} as SetContext)
setContext.displayName = 'MetricSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [likeMetrics, setLikeMetrics] = React.useState(
    persisted.get('disableLikeMetrics'),
  )
  const [repostMetrics, setRepostMetrics] = React.useState(
    persisted.get('disableRepostMetrics'),
  )
  const [quoteMetrics, setQuoteMetrics] = React.useState(
    persisted.get('disableQuoteMetrics'),
  )
  const [bookmarkMetrics, setBookmarkMetrics] = React.useState(
    persisted.get('disableBookmarkMetrics'),
  )
  const [replyMetrics, setReplyMetrics] = React.useState(
    persisted.get('disableReplyMetrics'),
  )

  const stateContextValue = React.useMemo(
    () => ({
      likeMetrics,
      repostMetrics,
      quoteMetrics,
      bookmarkMetrics,
      replyMetrics,
    }),
    [likeMetrics, repostMetrics, quoteMetrics, bookmarkMetrics, replyMetrics],
  )

  const setContextValue = React.useMemo(
    () => ({
      setLikeMetrics: (
        _likeMetrics: persisted.Schema['disableLikeMetrics'],
      ) => {
        setLikeMetrics(_likeMetrics)
        persisted.write('disableLikeMetrics', _likeMetrics)
      },
      setRepostMetrics: (
        _repostMetrics: persisted.Schema['disableRepostMetrics'],
      ) => {
        setRepostMetrics(_repostMetrics)
        persisted.write('disableRepostMetrics', _repostMetrics)
      },
      setQuoteMetrics: (
        _quoteMetrics: persisted.Schema['disableQuoteMetrics'],
      ) => {
        setQuoteMetrics(_quoteMetrics)
        persisted.write('disableQuoteMetrics', _quoteMetrics)
      },
      setBookmarkMetrics: (
        _bookmarkMetrics: persisted.Schema['disableBookmarkMetrics'],
      ) => {
        setBookmarkMetrics(_bookmarkMetrics)
        persisted.write('disableBookmarkMetrics', _bookmarkMetrics)
      },
      setReplyMetrics: (
        _replyMetrics: persisted.Schema['disableReplyMetrics'],
      ) => {
        setReplyMetrics(_replyMetrics)
        persisted.write('disableReplyMetrics', _replyMetrics)
      },
    }),
    [],
  )

  React.useEffect(() => {
    const unsub1 = persisted.onUpdate('disableLikeMetrics', nextLikeMetrics => {
      setLikeMetrics(nextLikeMetrics)
    })
    const unsub2 = persisted.onUpdate(
      'disableRepostMetrics',
      nextRepostMetrics => {
        setRepostMetrics(nextRepostMetrics)
      },
    )
    const unsub3 = persisted.onUpdate(
      'disableQuoteMetrics',
      nextQuoteMetrics => {
        setQuoteMetrics(nextQuoteMetrics)
      },
    )
    const unsub4 = persisted.onUpdate(
      'disableBookmarkMetrics',
      nextBookmarkMetrics => {
        setBookmarkMetrics(nextBookmarkMetrics)
      },
    )
    const unsub5 = persisted.onUpdate(
      'disableReplyMetrics',
      nextReplyMetrics => {
        setReplyMetrics(nextReplyMetrics)
      },
    )
    return () => {
      unsub1()
      unsub2()
      unsub3()
      unsub4()
      unsub5()
    }
  }, [])

  return (
    <stateContext.Provider value={stateContextValue}>
      <setContext.Provider value={setContextValue}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useMerticDisabledPref() {
  return React.useContext(stateContext)
}

export function useSetMetricDisabledPref() {
  return React.useContext(setContext)
}
