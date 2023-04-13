import {useMediaQuery} from 'react-responsive'

export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({
    query: '(min-width: 1230px)',
  })
  return {isDesktop}
}
