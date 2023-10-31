import {useNavigation} from '@react-navigation/native'
import {useEffect, useState} from 'react'
import {
  LOCAL_DEV_SERVICE,
  RootStoreModel,
  WAVERLY_TEST_SERVICE,
  useStores,
} from 'state/index'

const DEFAULT_HANDLE = 'alice.test'
const DEFAULT_PASSWORD = 'hunter2'

export type State = 'signingIn' | 'signedIn' | 'error'

export interface Result {
  state: State
  userDid: string
  groupDid: string
}

// Not passing a userHandle means we'll accept any user
export function useDevSignedIn(userHandle?: string) {
  const store = useStores()
  const [state, setState] = useState<State>('signingIn')

  const navigation = useNavigation()

  // Disable navigation while signing in
  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (state === 'signingIn') e.preventDefault()
    })
  }, [navigation, state])

  useEffect(() => {
    setState('signingIn')
    _signIn(store, userHandle)
      .then(() => setState('signedIn'))
      .catch(err => {
        setState('error')
        store.log.error(`Error signing in`, err)
      })
  }, [store, userHandle])

  return {state}
}

async function _signIn(store: RootStoreModel, userHandle?: string) {
  const urls = [LOCAL_DEV_SERVICE, WAVERLY_TEST_SERVICE]
  let service: string = store.agent.service.toString()
  let isValid = urls.some(url => service.startsWith(url))
  if (!isValid) {
    // Service is invalid, it could be just the default bluesky, but if the
    // user is already logged in, just fail.
    if (store.session.hasSession) {
      throw new Error(
        `Service must be ${LOCAL_DEV_SERVICE} or ${WAVERLY_TEST_SERVICE} ` +
          `(${service}). Logout first.`,
      )
    }

    // No active session, look for a better service
    store.log.debug('No active session, looking for a Waverly service')
    for (const url of urls) {
      try {
        store.log.debug(`Trying ${url}`)
        await store.session.describeService(url)
        service = url
        isValid = true
        break
      } catch {
        store.log.debug(`${url} unavailable`)
      }
    }
  }
  if (!isValid) throw new Error(`No services found on ${urls.join(', ')}`)
  store.log.debug(`Using service: ${service}`)

  // No user handle means we'll accept any user
  const currHandle = store.session.hasSession
    ? store.session.currentSession?.handle
    : undefined
  if (currHandle && (!userHandle || currHandle === userHandle)) return

  if (currHandle) {
    store.log.debug(`Logging out: ${currHandle}`)
    await store.session.logout()
  }
  const identifier = userHandle || DEFAULT_HANDLE
  store.log.debug(`Logging in: ${identifier}`)
  await store.session.login({service, identifier, password: DEFAULT_PASSWORD})
  if (!store.session.currentSession) throw new Error('Could not log in')
}
