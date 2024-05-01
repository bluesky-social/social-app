import {useSession} from '#/state/session'

// toy auth
export const useHeaders = () => {
  const {currentAccount} = useSession()
  return {
    get Authorization() {
      return currentAccount!.did
    },
  }
}
