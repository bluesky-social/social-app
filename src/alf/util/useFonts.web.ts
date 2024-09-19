import React from 'react'

export function useFonts() {
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    try {
      document.fonts.ready
        .then(() => {
          setLoaded(true)
        })
        .catch(() => {
          setLoaded(true)
        })
    } catch (e) {
      setLoaded(true)
    }
  }, [setLoaded])

  return [loaded, null]
}
