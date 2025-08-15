import {type AppBskyUnspeccedDefs} from '@atproto/api'
import {type QueryObserverBaseResult} from '@tanstack/react-query'

export type AgeAssuranceContextType = {
  /**
   * Whether the age assurance state has been fetched from the server. If user
   * is not in a region that requires AA, or AA is otherwise disabled, this
   * will always be `true`.
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
  /**
   * Indicates the user is age restricted based on the requirements of their
   * region, and their server-provided age assurance status. Does not factor in
   * the user's declared age. If AA is otherise disabled, this will always be
   * `false`.
   */
  isAgeRestricted: boolean
}

export type AgeAssuranceAPIContextType = {
  /**
   * Refreshes the age assurance state by fetching it from the server.
   */
  refetch: QueryObserverBaseResult['refetch']
}
