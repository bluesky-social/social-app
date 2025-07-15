import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {type QueryObserverBaseResult} from '@tanstack/react-query'

export type AgeAssuranceContextType = {
  /**
   * Whether the age assurance state has been fetched from the server.
   */
  isReady: boolean
  /**
   * The server-reported status of the user's age verification process.
   */
  status: AppBskyUnspeccedDefs.AgeAssuranceState['status']
  /**
   * The last time the age assurance state was attempted by the user.
   */
  lastInitiatedAt: AppBskyUnspeccedDefs.AgeAssuranceState['lastInitiatedAt']
}

export type AgeAssuranceAPIContextType = {
  /**
   * Refreshes the age assurance state by fetching it from the server.
   */
  refetch: QueryObserverBaseResult['refetch']
}
