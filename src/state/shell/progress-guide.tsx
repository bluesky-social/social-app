import React, {useMemo} from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {logEvent} from '#/lib/statsig/statsig'
import {
  ProgressGuideToast,
  ProgressGuideToastRef,
} from '#/components/ProgressGuide/Toast'
import {
  usePreferencesQuery,
  useSetActiveProgressGuideMutation,
} from '../queries/preferences'

export enum ProgressGuideAction {
  Like = 'like',
  Follow = 'follow',
}

type ProgressGuideName = 'like-10-and-follow-7' | 'follow-10'

/**
 * Progress Guides that extend this interface must specify their name in the `guide` field, so it can be used as a discriminated union
 */
interface BaseProgressGuide {
  guide: ProgressGuideName
  isComplete: boolean
  [key: string]: any
}

export interface Like10AndFollow7ProgressGuide extends BaseProgressGuide {
  guide: 'like-10-and-follow-7'
  numLikes: number
  numFollows: number
}

export interface Follow10ProgressGuide extends BaseProgressGuide {
  guide: 'follow-10'
  numFollows: number
}

export type ProgressGuide =
  | Like10AndFollow7ProgressGuide
  | Follow10ProgressGuide
  | undefined

const ProgressGuideContext = React.createContext<ProgressGuide>(undefined)

const ProgressGuideControlContext = React.createContext<{
  startProgressGuide(guide: ProgressGuideName): void
  endProgressGuide(): void
  captureAction(action: ProgressGuideAction, count?: number): void
}>({
  startProgressGuide: (_guide: ProgressGuideName) => {},
  endProgressGuide: () => {},
  captureAction: (_action: ProgressGuideAction, _count = 1) => {},
})

export function useProgressGuide(guide: ProgressGuideName) {
  const ctx = React.useContext(ProgressGuideContext)
  if (ctx?.guide === guide) {
    return ctx
  }
  return undefined
}

export function useProgressGuideControls() {
  return React.useContext(ProgressGuideControlContext)
}

export function Provider({children}: React.PropsWithChildren<{}>) {
  const {_} = useLingui()
  const {data: preferences} = usePreferencesQuery()
  const {mutateAsync, variables, isPending} =
    useSetActiveProgressGuideMutation()

  const activeProgressGuide = useMemo(() => {
    const rawProgressGuide = (
      isPending ? variables : preferences?.bskyAppState?.activeProgressGuide
    ) as ProgressGuide

    if (!rawProgressGuide) return undefined

    // ensure the unspecced attributes have the correct types
    // clone then mutate
    const {...maybeWronglyTypedProgressGuide} = rawProgressGuide
    if (maybeWronglyTypedProgressGuide?.guide === 'like-10-and-follow-7') {
      maybeWronglyTypedProgressGuide.numLikes =
        Number(maybeWronglyTypedProgressGuide.numLikes) || 0
      maybeWronglyTypedProgressGuide.numFollows =
        Number(maybeWronglyTypedProgressGuide.numFollows) || 0
    } else if (maybeWronglyTypedProgressGuide?.guide === 'follow-10') {
      maybeWronglyTypedProgressGuide.numFollows =
        Number(maybeWronglyTypedProgressGuide.numFollows) || 0
    }

    return maybeWronglyTypedProgressGuide
  }, [isPending, variables, preferences])

  const [localGuideState, setLocalGuideState] =
    React.useState<ProgressGuide>(undefined)

  if (activeProgressGuide && !localGuideState) {
    // hydrate from the server if needed
    setLocalGuideState(activeProgressGuide)
  }

  const firstLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const fifthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const tenthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)

  const fifthFollowToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const tenthFollowToastRef = React.useRef<ProgressGuideToastRef | null>(null)

  const controls = React.useMemo(() => {
    return {
      startProgressGuide(guide: ProgressGuideName) {
        if (guide === 'like-10-and-follow-7') {
          const guideObj = {
            guide: 'like-10-and-follow-7',
            numLikes: 0,
            numFollows: 0,
            isComplete: false,
          } satisfies ProgressGuide
          setLocalGuideState(guideObj)
          mutateAsync(guideObj)
        } else if (guide === 'follow-10') {
          const guideObj = {
            guide: 'follow-10',
            numFollows: 0,
            isComplete: false,
          } satisfies ProgressGuide
          setLocalGuideState(guideObj)
          mutateAsync(guideObj)
        }
      },

      endProgressGuide() {
        setLocalGuideState(undefined)
        mutateAsync(undefined)
        logEvent('progressGuide:hide', {})
      },

      captureAction(action: ProgressGuideAction, count = 1) {
        let guide = activeProgressGuide
        if (!guide || guide?.isComplete) {
          return
        }
        if (guide?.guide === 'like-10-and-follow-7') {
          if (action === ProgressGuideAction.Like) {
            guide = {
              ...guide,
              numLikes: (Number(guide.numLikes) || 0) + count,
            }
            if (guide.numLikes === 1) {
              firstLikeToastRef.current?.open()
            }
            if (guide.numLikes === 5) {
              fifthLikeToastRef.current?.open()
            }
            if (guide.numLikes === 10) {
              tenthLikeToastRef.current?.open()
            }
          }
          if (action === ProgressGuideAction.Follow) {
            guide = {
              ...guide,
              numFollows: (Number(guide.numFollows) || 0) + count,
            }
          }
          if (Number(guide.numLikes) >= 10 && Number(guide.numFollows) >= 7) {
            guide = {
              ...guide,
              isComplete: true,
            }
          }
        } else if (guide?.guide === 'follow-10') {
          if (action === ProgressGuideAction.Follow) {
            guide = {
              ...guide,
              numFollows: (Number(guide.numFollows) || 0) + count,
            }

            if (guide.numFollows === 5) {
              fifthFollowToastRef.current?.open()
            }
            if (guide.numFollows === 10) {
              tenthFollowToastRef.current?.open()
            }
          }
          if (Number(guide.numFollows) >= 10) {
            guide = {
              ...guide,
              isComplete: true,
            }
          }
        }

        setLocalGuideState(guide)
        mutateAsync(guide?.isComplete ? undefined : guide)
      },
    }
  }, [activeProgressGuide, mutateAsync, setLocalGuideState])

  return (
    <ProgressGuideContext.Provider value={localGuideState}>
      <ProgressGuideControlContext.Provider value={controls}>
        {children}
        {localGuideState?.guide === 'like-10-and-follow-7' && (
          <>
            <ProgressGuideToast
              ref={firstLikeToastRef}
              title={_(msg`Your first like!`)}
              subtitle={_(msg`Like 10 posts to train the Discover feed`)}
            />
            <ProgressGuideToast
              ref={fifthLikeToastRef}
              title={_(msg`Half way there!`)}
              subtitle={_(msg`Like 10 posts to train the Discover feed`)}
            />
            <ProgressGuideToast
              ref={tenthLikeToastRef}
              title={_(msg`Task complete - 10 likes!`)}
              subtitle={_(msg`The Discover feed now knows what you like`)}
            />
            <ProgressGuideToast
              ref={fifthFollowToastRef}
              title={_(msg`Half way there!`)}
              subtitle={_(msg`Follow 10 accounts`)}
            />
            <ProgressGuideToast
              ref={tenthFollowToastRef}
              title={_(msg`Task complete - 10 follows!`)}
              subtitle={_(msg`You've found some people to follow`)}
            />
          </>
        )}
      </ProgressGuideControlContext.Provider>
    </ProgressGuideContext.Provider>
  )
}
