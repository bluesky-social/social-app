export type SimpleVerificationState = {
  isVerified: boolean
  isVerifier: boolean
}

export type FullVerificationState = {
  profile: SimpleVerificationState & {
    isSelf: boolean
    wasVerified: boolean
  }
  viewer: Pick<SimpleVerificationState, 'isVerifier'> & {
    hasIssuedVerification: boolean
  }
}
