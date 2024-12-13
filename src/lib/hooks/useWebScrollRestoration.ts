import {useEffect, useMemo, useState} from 'react'
import {EventArg, useNavigation} from '@react-navigation/core'

if ('scrollRestoration' in history) {
  // Tell the brower not to mess with the scroll.
  // We're doing that manually below.
  history.scrollRestoration = 'manual'
}

function createInitialScrollState() {
  return {
    scrollYs: new Map(),
    focusedKey: null as string | null,
  }
}

export function useWebScrollRestoration() {
  const [state] = useState(createInitialScrollState)
  const navigation = useNavigation()

  useEffect(() => {
    function onDispatch() {
      if (state.focusedKey) {
        // Remember where we were for later.
        state.scrollYs.set(state.focusedKey, window.scrollY)
        // TODO: Strictly speaking, this is a leak. We never clean up.
        // This is because I'm not sure when it's appropriate to clean it up.
        // It doesn't seem like popstate is enough because it can still Forward-Back again.
        // Maybe we should use sessionStorage. Or check what Next.js is doing?
      }
    }
    // We want to intercept any push/pop/replace *before* the re-render.
    // There is no official way to do this yet, but this works okay for now.
    // https://twitter.com/satya164/status/1737301243519725803
    navigation.addListener('__unsafe_action__' as any, onDispatch)
    return () => {
      navigation.removeListener('__unsafe_action__' as any, onDispatch)
    }
  }, [state, navigation])

  const screenListeners = useMemo(
    () => ({
      focus(e: EventArg<'focus', boolean | undefined, unknown>) {
        const scrollY = state.scrollYs.get(e.target) ?? 0
        window.scrollTo(0, scrollY)
        state.focusedKey = e.target ?? null
      },
    }),
    [state],
  )
  return screenListeners
}
