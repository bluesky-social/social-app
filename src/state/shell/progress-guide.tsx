import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

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

type ProgressGuideName = 'like-10-and-follow-7'

interface BaseProgressGuide {
  guide: string
  isComplete: boolean
  [key: string]: any
}

interface Like10AndFollow7ProgressGuide extends BaseProgressGuide {
  numLikes: number
  numFollows: number
}

type ProgressGuide = Like10AndFollow7ProgressGuide | undefined

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

  const activeProgressGuide = (
    isPending ? variables : preferences?.bskyAppState?.activeProgressGuide
  ) as ProgressGuide

  // ensure the unspecced attributes have the correct types
  if (activeProgressGuide?.guide === 'like-10-and-follow-7') {
    activeProgressGuide.numLikes = Number(activeProgressGuide.numLikes) || 0
    activeProgressGuide.numFollows = Number(activeProgressGuide.numFollows) || 0
  }

  const [localGuideState, setLocalGuideState] =
    React.useState<ProgressGuide>(undefined)

  if (activeProgressGuide && !localGuideState) {
    // hydrate from the server if needed
    setLocalGuideState(activeProgressGuide)
  }

  const firstLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const fifthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const tenthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const guideCompleteToastRef = React.useRef<ProgressGuideToastRef | null>(null)

  const controls = React.useMemo(() => {
    return {
      startProgressGuide(guide: ProgressGuideName) {
        if (guide === 'like-10-and-follow-7') {
          const guideObj = {
            guide: 'like-10-and-follow-7',
            numLikes: 0,
            numFollows: 0,
            isComplete: false,
          }
          setLocalGuideState(guideObj)
          mutateAsync(guideObj)
        }
      },

      endProgressGuide() {
        setLocalGuideState(undefined)
        mutateAsync(undefined)
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
              ref={guideCompleteToastRef}
              title={_(msg`Algorithm training complete!`)}
              subtitle={_(msg`The Discover feed now knows what you like`)}
            />
          </>
        )}
      </ProgressGuideControlContext.Provider>
    </ProgressGuideContext.Provider>
  )
}
