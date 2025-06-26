import {useAgeAssuranceContext} from '#/state/ageAssurance'

export function True({children}: {children: React.ReactNode}) {
  const {isLoaded, isAgeRestricted} = useAgeAssuranceContext()
  return isLoaded && isAgeRestricted ? children : null
}

export function False({children}: {children: React.ReactNode}) {
  const {isLoaded, isAgeRestricted} = useAgeAssuranceContext()
  return isLoaded && !isAgeRestricted ? children : null
}

export const IsAgeRestricted = {
  True,
  False,
}
