import {QueryClient} from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // NOTE
      // refetchOnWindowFocus breaks some UIs (like feeds)
      // so we NEVER want to enable this
      // -prf
      refetchOnWindowFocus: false,
    },
  },
})
