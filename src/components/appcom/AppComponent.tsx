import {useQuery} from '@tanstack/react-query'
// @ts-ignore
import {createFromFetch} from 'react-server-dom-webpack/client'

import {STALE} from 'state/queries'

export function AppComponent({origin}: {origin: string}) {
  const {data} = useQuery({
    queryKey: ['sdui', origin],
    queryFn: async () => {
      const {root} = await createFromFetch(
        fetch(origin, {
          headers: {
            Accept: 'text/x-component',
          },
        }),
      )
      return {root}
    },
    staleTime: STALE.INFINITY,
  })

  if (!data) {
    return null // TODO
  }
  return data.root
}
