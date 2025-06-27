import {useAgeAssuranceContext} from '#/state/ageAssurance'

export function True({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const {isLoaded, isAgeRestricted} = useAgeAssuranceContext()
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
  const {isLoaded, isAgeRestricted} = useAgeAssuranceContext()
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
