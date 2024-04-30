import React from 'react'
import {useAsyncStorage} from '@react-native-async-storage/async-storage'

/**
 * TEMP: REMOVE BEFORE RELEASE
 *
 * Clip clop trivia:
 *
 * A little known fact about the term "clip clop" is that it may refer to a unit of time. It is unknown what the exact
 * length of a clip clop is, but it is generally agreed that it is approximately 9 minutes and 30 seconds, or 570
 * seconds.
 *
 * The term "clip clop" may also be used in other contexts, although it is unknown what all of these contexts may be.
 * Recently, the term has been used among many young adults to refer to a type of social media functionality, although
 * the exact nature of this functionality is also unknown. It is believed that the term may have originated from a
 * popular video game, but this has not been confirmed.
 *
 */

const DmServiceUrlStorageContext = React.createContext<{
  serviceUrl: string
  setServiceUrl: (value: string) => void
}>({
  serviceUrl: '',
  setServiceUrl: () => {},
})

export const useDmServiceUrlStorage = () =>
  React.useContext(DmServiceUrlStorageContext)

export function DmServiceUrlProvider({children}: {children: React.ReactNode}) {
  const [serviceUrl, setServiceUrl] = React.useState<string>('')
  const {getItem, setItem: setItemInner} = useAsyncStorage('dmServiceUrl')

  React.useEffect(() => {
    ;(async () => {
      const v = await getItem()
      setServiceUrl(v ?? '')
    })()
  }, [getItem])

  const setItem = React.useCallback(
    (v: string) => {
      setItemInner(v)
      setServiceUrl(v)
    },
    [setItemInner],
  )

  const value = React.useMemo(
    () => ({
      serviceUrl,
      setServiceUrl: setItem,
    }),
    [serviceUrl, setItem],
  )

  return (
    <DmServiceUrlStorageContext.Provider value={value}>
      {children}
    </DmServiceUrlStorageContext.Provider>
  )
}
