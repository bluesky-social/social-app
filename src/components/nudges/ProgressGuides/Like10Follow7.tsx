import React from 'react'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  ProgressGuideToast,
  ProgressGuideToastRef,
} from '#/components/ProgressGuide/Toast'
import {useNudges, NudgeType} from '#/components/nudges'

export type Action = {
  type: 'activate'
} | {
  type: 'like'
}

export function useProgressGuide() {
  const {nudges, activateNudges, updateNudges, dismissNudges} = useNudges()
  const firstLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const fifthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const tenthLikeToastRef = React.useRef<ProgressGuideToastRef | null>(null)
  const isActive = Boolean(nudges.find(n => n.type === NudgeType.progressGuide_like10Follow7))

  const dispatch = (action: Action) => {
    const prevState = nudges.find(n => n.type === NudgeType.progressGuide_like10Follow7)

    if (!prevState || prevState.type !== NudgeType.progressGuide_like10Follow7) return

    let next = prevState

    switch (action.type) {
      case 'activate': {
        activateNudges([
          {
            type: NudgeType.progressGuide_like10Follow7,
            numLikes: 0,
            numFollows: 0,
            complete: false,
          },
        ])
        break;
      }
      case 'like': {
        next = {
          ...next,
          numLikes: prevState.numLikes + 1,
        }
        break;
      }
      default:
    }
  }

  return {
    isActive,
    dispatch,
    refs: {
      firstLikeToastRef,
      fifthLikeToastRef,
      tenthLikeToastRef,
    },
  }
}

export function Toasts() {
  const {_} = useLingui()
  const {isActive, refs} = useProgressGuide()

  return isActive ? (
    <>
      <ProgressGuideToast
        ref={refs.firstLikeToastRef}
        title={_(msg`Your first like!`)}
        subtitle={_(msg`Like 10 posts to train the Discover feed`)}
      />
      <ProgressGuideToast
        ref={refs.fifthLikeToastRef}
        title={_(msg`Half way there!`)}
        subtitle={_(msg`Like 10 posts to train the Discover feed`)}
      />
      <ProgressGuideToast
        ref={refs.tenthLikeToastRef}
        title={_(msg`Task complete - 10 likes!`)}
        subtitle={_(msg`The Discover feed now knows what you like`)}
      />
    </>
  ) : null
}
