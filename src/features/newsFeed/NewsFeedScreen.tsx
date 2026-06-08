import {useMemo, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {atoms as a} from '#/alf'
import * as Layout from '#/components/Layout'
import {Loader} from '#/components/Loader'
import * as Prompt from '#/components/Prompt'
import {NewsFeedTab} from './components/NewsFeedTab'
import {SetupSources} from './components/SetupSources'
import {SetupTopics} from './components/SetupTopics'
import {
  makeDefaultNewsFeedPrefs,
  type NewsFeedPrefs,
  useNewsFeedPrefsDeleteMutation,
  useNewsFeedPrefsMutation,
  useNewsFeedPrefsQuery,
} from './state/prefs'

type SetupState = {step: 'topics' | 'sources'; draft: NewsFeedPrefs}

type Props = NativeStackScreenProps<CommonNavigatorParams, 'NewsFeed'>

export function NewsFeedScreen({}: Props) {
  const {t: l} = useLingui()
  const resetPromptControl = Prompt.usePromptControl()
  const {data: prefs, isLoading} = useNewsFeedPrefsQuery()
  const {mutateAsync: savePrefs} = useNewsFeedPrefsMutation()
  const {mutate: deletePrefs} = useNewsFeedPrefsDeleteMutation()

  const [setup, setSetup] = useState<SetupState | null>(null)
  // Optimistic copy so the feed shows immediately after saving, before the
  // record query refetches.
  const [savedPrefs, setSavedPrefs] = useState<NewsFeedPrefs | null>(null)

  const effective = prefs ?? savedPrefs
  const isConfigured = !!effective && effective.topics.length > 0

  // Stable default draft for the implicit first-time setup session.
  const freshDraft = useMemo(() => makeDefaultNewsFeedPrefs(), [])

  // With no welcome screen, an unconfigured feed drops straight into step 1.
  const activeSetup: SetupState | null =
    setup ??
    (!isLoading && !isConfigured ? {step: 'topics', draft: freshDraft} : null)

  // Returns true if the back press was handled here, so the header doesn't also
  // navigate away. Returning nothing lets the back button leave the screen.
  const exitSetup = (): boolean | void => {
    // Editing an existing feed: just close setup and stay on the feed.
    if (isConfigured) {
      setSetup(null)
      return true
    }
    // First-time setup: nothing to return to, so let the back button leave.
  }

  const clearDraft = () => {
    if (!activeSetup) return
    setSetup({
      ...activeSetup,
      draft: {...activeSetup.draft, topics: [], regions: [], excludedDids: []},
    })
  }

  const resetSetup = () => {
    // For a saved feed, Reset deletes the published record, so confirm first.
    // An unsaved draft just clears in place.
    if (isConfigured) {
      resetPromptControl.open()
    } else {
      clearDraft()
    }
  }

  const confirmReset = () => {
    setSavedPrefs(null)
    deletePrefs()
    clearDraft()
  }

  const finishSetup = async (draft: NewsFeedPrefs) => {
    setSavedPrefs(draft)
    setSetup(null)
    try {
      await savePrefs(draft)
    } catch {
      // surfaced + logged by the mutation
    }
  }

  if (activeSetup) {
    if (activeSetup.step === 'topics') {
      return (
        <>
          <SetupTopics
            topics={activeSetup.draft.topics}
            regions={activeSetup.draft.regions}
            onChangeTopics={topics =>
              setSetup({...activeSetup, draft: {...activeSetup.draft, topics}})
            }
            onChangeRegions={regions =>
              setSetup({...activeSetup, draft: {...activeSetup.draft, regions}})
            }
            onBack={exitSetup}
            onReset={resetSetup}
            onNext={() => setSetup({...activeSetup, step: 'sources'})}
          />
          <Prompt.Basic
            control={resetPromptControl}
            title={l`Remove your news feed?`}
            description={l`This deletes your saved topics and sources from your account. You can set up the feed again anytime.`}
            confirmButtonCta={l`Remove`}
            confirmButtonColor="negative"
            onConfirm={confirmReset}
          />
        </>
      )
    }
    return (
      <SetupSources
        draft={activeSetup.draft}
        onChangeExcluded={excludedDids =>
          setSetup({
            ...activeSetup,
            draft: {...activeSetup.draft, excludedDids},
          })
        }
        onBack={() => {
          setSetup({...activeSetup, step: 'topics'})
          return true
        }}
        onDone={() => {
          void finishSetup(activeSetup.draft)
        }}
      />
    )
  }

  if (isConfigured && effective) {
    return (
      <NewsFeedTab
        prefs={effective}
        onEdit={() => setSetup({step: 'topics', draft: effective})}
      />
    )
  }

  // Loading, or the transient frame before the effect enters setup.
  return (
    <Layout.Screen testID="newsFeedScreen">
      <Layout.Center style={[a.flex_1, a.justify_center, a.align_center]}>
        <Loader size="xl" />
      </Layout.Center>
    </Layout.Screen>
  )
}
