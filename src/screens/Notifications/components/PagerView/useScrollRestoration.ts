/**
 * Native pages retain their scroll positions in their own lists.
 */
export function useScrollRestoration(
  selectPage: (page: number) => void,
  _selectedPage: number,
) {
  return selectPage
}
