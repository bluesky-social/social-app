import Graphemer from 'graphemer'
import {useCallback, useMemo} from 'react'

export const useGrapheme = () => {
  const splitter = useMemo(() => new Graphemer(), [])

  const getGraphemeString = useCallback(
    (name: string, length: number) => {
      let remainingCharacters = 0

      if (name.length > length) {
        const graphemes = splitter.splitGraphemes(name)

        if (graphemes.length > length) {
          remainingCharacters = 0
          name = `${graphemes.slice(0, length).join('')}...`
        } else {
          remainingCharacters = length - graphemes.length
          name = graphemes.join('')
        }
      } else {
        remainingCharacters = length - name.length
      }

      return {
        name,
        remainingCharacters,
      }
    },
    [splitter],
  )

  return {
    getGraphemeString,
  }
}
