import React from 'react'

export function useInteractionState() {
  const [state, setState] = React.useState(false)

  const onIn = React.useCallback(() => {
    setState(true)
  }, [setState])
  const onOut = React.useCallback(() => {
    setState(false)
  }, [setState])

  return React.useMemo(
    () => ({
      state,
      onIn,
      onOut,
    }),
    [state, onIn, onOut],
  )
}
