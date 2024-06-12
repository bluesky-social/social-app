import React from 'react'

export function useStarterPackEntry() {
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      setReady(true)
    })()
  }, [])

  return ready
}
