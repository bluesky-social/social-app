import {useCallback, useMemo, useState} from 'react'

export function useInteractionState() {
  const [state, setState] = useState(false)

  const onIn = useCallback(() => {
    setState(true)
  }, [setState])
  const onOut = useCallback(() => {
    setState(false)
  }, [setState])

  return useMemo(
    () => ({
      state,
      onIn,
      onOut,
    }),
    [state, onIn, onOut],
  )
}
