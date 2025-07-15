import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {type QueryObserverBaseResult} from '@tanstack/react-query'

export type AgeAssuranceContextType = {
  isLoaded: boolean
  /**
   * The server-reported status of the user's age verification process.
   */
  status: AppBskyUnspeccedDefs.AgeAssuranceState['status']
  /**
   * The last time the age assurance state was attempted by the user.
   */
  lastInitiatedAt: string | undefined
  /**
   * Whether the current user is age-restricted based on their geolocation and
   * age assurance state retrieved from the server.
   */
  isAgeRestricted: boolean
}

export type AgeAssuranceAPIContextType = {
  /**
   * Refreshes the age assurance state by fetching it from the server.
   */
  refetch: QueryObserverBaseResult['refetch']
}
