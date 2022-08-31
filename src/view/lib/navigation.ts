import {useEffect} from 'react'
import {useStores} from '../../state'

type CB = () => void
/**
 * This custom effect hook will trigger on every "navigation"
 * Use this in screens to handle any loading behaviors needed
 */
export function useLoadEffect(cb: CB, deps: any[] = []) {
  const store = useStores()
  useEffect(cb, [store.nav.tab, ...deps])
}
