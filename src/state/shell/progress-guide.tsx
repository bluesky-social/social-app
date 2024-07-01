import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  ProgressGuideToast,
  ProgressGuideToastRef,
} from '#/components/ProgressGuide/Toast'

export enum ProgressGuideAction {
  Like = 'like',
}

export enum ProgressGuideName {
  Like10Posts = 'like-10-posts',
}

interface BaseProgressGuide {
  guide: ProgressGuideName
  isComplete: boolean
}

interface Like10PostsProgressGuide extends BaseProgressGuide {
  guide: ProgressGuideName.Like10Posts
  numLikes: number
}

type ProgressGuide = Like10PostsProgressGuide | undefined

const ProgressGuideContext = React.createContext<ProgressGuide>(undefined)

const ProgressGuideControlContext = React.createContext<{
  startProgressGuide(guide: ProgressGuideName): void
  endProgressGuide(): void
  captureAction(action: ProgressGuideAction): void
}>({
  startProgressGuide: (_guide: ProgressGuideName) => {},
  endProgressGuide: () => {},
  captureAction: (_action: ProgressGuideAction) => {},
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

  const [activeProgressGuide, setActiveProgressGuide] =
    React.useState<ProgressGuide>({
      guide: ProgressGuideName.Like10Posts,
      numLikes: 0,
      isComplete: false,
    })

  const firstLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const fifthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const tenthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)

  const controls = React.useMemo(() => {
    return {
      startProgressGuide(guide: ProgressGuideName) {
        if (guide === ProgressGuideName.Like10Posts) {
          setActiveProgressGuide({
            guide: ProgressGuideName.Like10Posts,
            numLikes: 0,
            isComplete: false,
          })
        }
      },

      endProgressGuide() {
        setActiveProgressGuide(undefined)
      },

      captureAction(action: ProgressGuideAction) {
        let guide = activeProgressGuide
        if (guide?.isComplete) {
          return
        }
        if (guide?.guide === ProgressGuideName.Like10Posts) {
          if (action === ProgressGuideAction.Like) {
            guide = {
              ...guide,
              numLikes: (guide.numLikes || 0) + 1,
            }
            if (guide.numLikes === 1) {
              firstLikeToastRef.current?.open()
            }
            if (guide.numLikes === 5) {
              fifthLikeToastRef.current?.open()
            }
            if (guide.numLikes === 10) {
              tenthLikeToastRef.current?.open()
              guide = {
                ...guide,
                isComplete: true,
              }
            }
          }
        }
        setActiveProgressGuide(guide)
      },
    }
  }, [activeProgressGuide, setActiveProgressGuide])

  return (
    <ProgressGuideContext.Provider value={activeProgressGuide}>
      <ProgressGuideControlContext.Provider value={controls}>
        {children}
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
      </ProgressGuideControlContext.Provider>
    </ProgressGuideContext.Provider>
  )
}
