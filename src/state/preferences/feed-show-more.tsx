import {createContext, useContext, useEffect, useState} from 'react'

import * as persisted from '#/state/persisted'

export const FEED_SHOW_MORE_BATCH_SIZES = [30, 60, 90] as const
export type FeedShowMoreBatchSize = (typeof FEED_SHOW_MORE_BATCH_SIZES)[number]
export const DEFAULT_FEED_SHOW_MORE_BATCH_SIZE: FeedShowMoreBatchSize = 30

export function isFeedShowMoreBatchSize(
  value: unknown,
): value is FeedShowMoreBatchSize {
  return (
    typeof value === 'number' &&
    (FEED_SHOW_MORE_BATCH_SIZES as readonly number[]).includes(value)
  )
}

function normalizeBatchSize(value: number | undefined): FeedShowMoreBatchSize {
  return isFeedShowMoreBatchSize(value)
    ? value
    : DEFAULT_FEED_SHOW_MORE_BATCH_SIZE
}

const enabledStateContext = createContext(
  !!persisted.defaults.feedShowMoreEnabled,
)
const enabledSetContext = createContext<(value: boolean) => void>(() => {})
const batchSizeStateContext = createContext<FeedShowMoreBatchSize>(
  normalizeBatchSize(persisted.defaults.feedShowMoreBatchSize),
)
const batchSizeSetContext = createContext<
  (value: FeedShowMoreBatchSize) => void
>(() => {})

export function Provider({children}: {children: React.ReactNode}) {
  const [enabled, setEnabled] = useState(!!persisted.get('feedShowMoreEnabled'))
  const [batchSize, setBatchSize] = useState(
    normalizeBatchSize(persisted.get('feedShowMoreBatchSize')),
  )
  const setEnabledWrapped = (value: boolean) => {
    setEnabled(value)
    void persisted.write('feedShowMoreEnabled', value)
  }
  const setBatchSizeWrapped = (value: FeedShowMoreBatchSize) => {
    setBatchSize(value)
    void persisted.write('feedShowMoreBatchSize', value)
  }

  useEffect(
    () =>
      persisted.onUpdate('feedShowMoreEnabled', value => setEnabled(!!value)),
    [],
  )
  useEffect(
    () =>
      persisted.onUpdate('feedShowMoreBatchSize', value =>
        setBatchSize(normalizeBatchSize(value)),
      ),
    [],
  )

  return (
    <enabledStateContext.Provider value={enabled}>
      <enabledSetContext.Provider value={setEnabledWrapped}>
        <batchSizeStateContext.Provider value={batchSize}>
          <batchSizeSetContext.Provider value={setBatchSizeWrapped}>
            {children}
          </batchSizeSetContext.Provider>
        </batchSizeStateContext.Provider>
      </enabledSetContext.Provider>
    </enabledStateContext.Provider>
  )
}

export const useFeedShowMoreEnabled = () => useContext(enabledStateContext)
export const useSetFeedShowMoreEnabled = () => useContext(enabledSetContext)
export const useFeedShowMoreBatchSize = () => useContext(batchSizeStateContext)
export const useSetFeedShowMoreBatchSize = () => useContext(batchSizeSetContext)
