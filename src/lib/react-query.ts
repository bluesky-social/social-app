import {QueryClient} from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // NOTE
      // refetchOnWindowFocus breaks some UIs (like feeds)
      // so we NEVER want to enable this
      // -prf
      refetchOnWindowFocus: false,
      // Structural sharing between responses makes it impossible to rely on
      // "first seen" timestamps on objects to determine if they're fresh.
      // Disable this optimization so that we can rely on "first seen" timestamps.
      structuralSharing: false,
    },
  },
})
