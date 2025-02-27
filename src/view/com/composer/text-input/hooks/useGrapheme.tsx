import {useCallback} from 'react'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

export const useGrapheme = () => {
  const getGraphemeString = useCallback((name: string, length: number) => {
    let remainingCharacters = 0

    if (name.length > length) {
      const graphemes = [...splitGraphemes(name)]

      if (graphemes.length > length) {
        remainingCharacters = 0
        name = `${graphemes.slice(0, length).join('')}…`
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
  }, [])

  return {
    getGraphemeString,
  }
}
