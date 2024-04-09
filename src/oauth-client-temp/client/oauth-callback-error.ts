export class OAuthCallbackError extends Error {
  static from(err: unknown, params: URLSearchParams, state?: string) {
    if (err instanceof OAuthCallbackError) return err
    const message = err instanceof Error ? err.message : undefined
    return new OAuthCallbackError(params, message, state, err)
  }

  constructor(
    public readonly params: URLSearchParams,
    message = params.get('error_description') || 'OAuth callback error',
    public readonly state?: string,
    cause?: unknown,
  ) {
    super(message, { cause })
  }
}
