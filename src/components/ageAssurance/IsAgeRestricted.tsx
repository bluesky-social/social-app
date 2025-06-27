import {useAgeAssuranceContext} from '#/state/age-assurance'

export function True({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const {isLoaded, isAgeRestricted, isExempt} = useAgeAssuranceContext()
  /**
   * For the true case, if the user is exempt, return nothing
   */
  if (isExempt) return null

  const isDefinitelyAgeRestricted = isLoaded && isAgeRestricted
  const notSureYet = isAgeRestricted

  return isDefinitelyAgeRestricted
    ? children
    : notSureYet
      ? fallback || null
      : null
}

export function False({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const {isLoaded, isAgeRestricted, isExempt} = useAgeAssuranceContext()

  /**
   * For the false case, if the user is exempt, return children
   */
  if (isExempt) return children

  const isDefinitelyNotAgeRestricted = isLoaded && !isAgeRestricted
  const notSureYet = !isAgeRestricted

  return isDefinitelyNotAgeRestricted
    ? children
    : notSureYet
      ? fallback || null
      : null
}

export const IsAgeRestricted = {
  True,
  False,
}
