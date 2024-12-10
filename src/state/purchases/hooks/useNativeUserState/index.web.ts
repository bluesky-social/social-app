import {NativePurchaseRestricted} from '#/state/purchases/types'

export function useNativeUserState(): {
  loading: boolean
  restricted: NativePurchaseRestricted
} {
  return {
    loading: false,
    restricted: 'no',
  }
}
