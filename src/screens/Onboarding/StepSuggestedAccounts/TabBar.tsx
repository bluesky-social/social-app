import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {popularInterests, useInterestsDisplayNames} from '#/lib/interests'
import {tokens} from '#/alf'
import {boostInterests, InterestTabs} from '#/components/InterestTabs'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

export default function TabBar({
  selectedInterest,
  onSelectInterest,
  selectedInterests,
  hideDefaultTab,
  defaultTabLabel,
}: {
  selectedInterest: string | null
  onSelectInterest: (interest: string | null) => void
  selectedInterests: string[]
  hideDefaultTab?: boolean
  defaultTabLabel?: string
}) {
  const {_} = useLingui()
  const ax = useAnalytics()
  const interestsDisplayNames = useInterestsDisplayNames()
  const interests = Object.keys(interestsDisplayNames)
    .sort(boostInterests(popularInterests))
    .sort(boostInterests(selectedInterests))

  return (
    <InterestTabs
      interests={hideDefaultTab ? interests : ['all', ...interests]}
      selectedInterest={
        selectedInterest || (hideDefaultTab ? interests[0] : 'all')
      }
      onSelectTab={tab => {
        ax.metric('onboarding:suggestedAccounts:tabPressed', {tab: tab})
        onSelectInterest(tab === 'all' ? null : tab)
      }}
      interestsDisplayNames={
        hideDefaultTab
          ? interestsDisplayNames
          : {
              all: defaultTabLabel || _(msg`For You`),
              ...interestsDisplayNames,
            }
      }
      gutterWidth={IS_WEB ? 0 : tokens.space.xl}
    />
  )
}
