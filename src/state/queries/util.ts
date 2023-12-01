import {QueryClient, QueryKey, InfiniteData} from '@tanstack/react-query'

export function truncateAndInvalidate<T = any>(
  queryClient: QueryClient,
  querykey: QueryKey,
) {
  queryClient.setQueryData<InfiniteData<T>>(querykey, data => {
    if (data) {
      return {
        pageParams: data.pageParams.slice(0, 1),
        pages: data.pages.slice(0, 1),
      }
    }
    return data
  })
  queryClient.invalidateQueries({queryKey: querykey})
}
