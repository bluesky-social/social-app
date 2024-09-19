import React from 'react'

export function useFonts() {
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    document.fonts.ready.then(() => {
      setLoaded(true)
    })
  }, [setLoaded])

  return [loaded, null]
}
