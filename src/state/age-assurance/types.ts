import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {type QueryObserverBaseResult} from '@tanstack/react-query'

export type AgeAssuranceContextType = {
  isLoaded: boolean
  status: AppBskyUnspeccedDefs.AgeAssuranceState['status']
  /**
   * Whether the current user is age-restricted based on their geolocation and
   * age assurance state retrieved from the server.
   */
  isAgeRestricted: boolean
  /**
   * Whether the user is exempt from age assurance checks, e.g., due to
   * them not being in a region that requires age assurance.
   */
  isExempt: boolean
  /**
   * The last time the age assurance state was attempted by the user.
   */
  lastInitiatedAt: string | undefined
  /**
   * Whether the user has initiated an age assurance check.
   */
  hasInitiated: boolean
}

export type AgeAssuranceAPIContextType = {
  /**
   * Refreshes the age assurance state by fetching it from the server.
   */
  refetch: QueryObserverBaseResult['refetch']
}
