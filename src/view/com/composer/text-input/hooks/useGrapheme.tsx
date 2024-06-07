import {useCallback} from 'react'
import {graphemeSegments} from 'unicode-segmenter/grapheme'

export const useGrapheme = () => {
  const getGraphemeString = useCallback((name: string, length: number) => {
    let remainingCharacters = 0

    if (name.length > length) {
      const segments = [...graphemeSegments(name)]
      const joinSegments = (
        name: string,
        {segment}: (typeof segments)[number],
      ) => name + segment

      if (segments.length > length) {
        remainingCharacters = 0
        name = `${segments.slice(0, length).reduce(joinSegments, '')}...`
      } else {
        remainingCharacters = length - segments.length
        name = segments.reduce(joinSegments, '')
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
