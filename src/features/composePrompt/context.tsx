import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  clamp,
  type DerivedValue,
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {SHELL_SPRING_CONFIG} from '#/lib/custom-animations/springs'
import {useHideBottomBarBorderForScreen} from '#/lib/hooks/useHideBottomBarBorder'
import {
  useScreenCoverage,
  useScreenPresence,
} from '#/lib/hooks/useScreenPresence'
import {type ComposerOpts} from '#/state/shell/composer'

export type ComposePromptOpenOptions = Pick<
  ComposerOpts,
  'imageUris' | 'openGallery'
>

export type ComposePromptConfig = {
  /**
   * Placeholder text shown in the pill, e.g. "What's up?"
   */
  label: string
  /**
   * Accessibility label and hint for the pill's main press target.
   */
  accessibilityLabel: string
  accessibilityHint: string
  /**
   * Opens the composer. Media picked from the pill's camera and gallery
   * buttons is passed through so the screen can merge it with its own
   * options (reply target, mention, log context).
   */
  open: (options?: ComposePromptOpenOptions) => void
}

type Entry = {
  id: number
  /**
   * The registering screen's own presence, 0..1.
   */
  presence: SharedValue<number>
  /**
   * 1 once the screen has unregistered but is still fading out. A screen that
   * is popped from JS is unmounted at the start of the pop and replaced by a
   * native snapshot, so its own presence stops updating; while leaving, the
   * entry instead contributes whatever share of the screen no mounted screen
   * covers yet, which is exactly the incoming screen's complement.
   */
  leaving: SharedValue<number>
  /**
   * Springs 1 to 0 after unregistering. Fades a screen that leaves while
   * still fully on screen (e.g. its config switched off) and times removal.
   */
  fade: SharedValue<number>
  config: ComposePromptConfig
}

type StateContext = {
  /**
   * How visible the pill should be, 0 (hidden) to 1 (shown): the summed
   * presence of every screen that shows it, clamped.
   */
  visibility: DerivedValue<number>
  /**
   * Config of the screen that is currently the most present, or undefined
   * when no screen shows the pill.
   */
  config: ComposePromptConfig | undefined
}

type ActionsContext = {
  register: (
    presence: SharedValue<number>,
    leaving: SharedValue<number>,
    fade: SharedValue<number>,
    config: ComposePromptConfig,
  ) => number
  update: (id: number, config: ComposePromptConfig) => void
  unregister: (id: number) => void
}

const stateContext = createContext<StateContext | null>(null)
stateContext.displayName = 'ComposePromptStateContext'
const actionsContext = createContext<ActionsContext | null>(null)
actionsContext.displayName = 'ComposePromptActionsContext'

let nextId = 0

export function Provider({children}: {children: React.ReactNode}) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const coverage = useScreenCoverage()

  const visibility = useDerivedValue(() => {
    let sum = 0
    for (const entry of entries) {
      sum += entryPresence(entry, coverage.get())
    }
    return clamp(sum, 0, 1)
  }, [entries, coverage])

  /*
   * The pill shows the label of whichever screen is the most present, so
   * that during a push or swipe-back the text switches at the midpoint of
   * the transition rather than when the outgoing screen unmounts.
   */
  const mostPresentId = useDerivedValue(() => {
    let best: number | null = null
    let bestPresence = 0
    for (const entry of entries) {
      const presence = entryPresence(entry, coverage.get())
      if (presence > bestPresence) {
        best = entry.id
        bestPresence = presence
      }
    }
    return best
  }, [entries, coverage])

  useAnimatedReaction(
    () => mostPresentId.get(),
    (current, previous) => {
      // keep the last label while everything fades out
      if (current !== previous && current !== null) {
        scheduleOnRN(setActiveId, current)
      }
    },
  )

  const actions = useMemo<ActionsContext>(
    () => ({
      register(presence, leaving, fade, config) {
        const id = nextId++
        setEntries(prev => [...prev, {id, presence, leaving, fade, config}])
        return id
      },
      update(id, config) {
        setEntries(prev =>
          prev.map(entry => (entry.id === id ? {...entry, config} : entry)),
        )
      },
      unregister(id) {
        setEntries(prev => prev.filter(entry => entry.id !== id))
      },
    }),
    [],
  )

  const config = (
    entries.find(entry => entry.id === activeId) ?? entries.at(-1)
  )?.config
  const state = useMemo<StateContext>(
    () => ({visibility, config}),
    [visibility, config],
  )

  return (
    <stateContext.Provider value={state}>
      <actionsContext.Provider value={actions}>
        {children}
      </actionsContext.Provider>
    </stateContext.Provider>
  )
}

function entryPresence(entry: Entry, coverage: number) {
  'worklet'
  if (!entry.leaving.get()) {
    return entry.presence.get()
  }
  return Math.max(1 - coverage, entry.presence.get() * entry.fade.get())
}

/**
 * What the pill should render right now. Used by the bottom bars.
 */
export function useComposePromptState() {
  const context = useContext(stateContext)
  if (!context) {
    throw new Error(
      'useComposePromptState must be used within a ComposePromptProvider',
    )
  }
  return context
}

function useComposePromptActions() {
  const context = useContext(actionsContext)
  if (!context) {
    throw new Error(
      'useComposePromptActions must be used within a ComposePromptProvider',
    )
  }
  return context
}

/**
 * Shows the compose pill in the bottom bar while the surrounding
 * `Layout.Screen` is present, following its transition in and out frame by
 * frame. Pass `null` to show nothing (e.g. when replies are disabled).
 */
export function useComposePromptForScreen(config: ComposePromptConfig | null) {
  const {register, update, unregister} = useComposePromptActions()
  const {presence} = useScreenPresence()
  const leaving = useSharedValue(0)
  const fade = useSharedValue(1)
  const idRef = useRef<number | null>(null)
  const enabled = config !== null

  // the bar's top border would cut across the pill's gradient
  useHideBottomBarBorderForScreen({enabled})

  const getConfig = useEffectEvent(() => config)

  useEffect(() => {
    const initial = getConfig()
    if (!initial) return
    leaving.set(0)
    fade.set(1)
    const id = register(presence, leaving, fade, initial)
    idRef.current = id
    return () => {
      idRef.current = null
      leaving.set(1)
      fade.set(
        withSpring(0, SHELL_SPRING_CONFIG, finished => {
          if (finished) {
            scheduleOnRN(unregister, id)
          }
        }),
      )
    }
  }, [enabled, register, unregister, leaving, fade, presence])

  const label = config?.label
  const accessibilityLabel = config?.accessibilityLabel
  const accessibilityHint = config?.accessibilityHint
  const open = config?.open
  useEffect(() => {
    if (
      idRef.current !== null &&
      label &&
      accessibilityLabel &&
      accessibilityHint &&
      open
    ) {
      update(idRef.current, {
        label,
        accessibilityLabel,
        accessibilityHint,
        open,
      })
    }
  }, [label, accessibilityLabel, accessibilityHint, open, update])
}
