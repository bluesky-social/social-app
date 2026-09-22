import {githubReader} from './check-github.mjs'

/** Live transport. Writes are never retried: their outcome may be ambiguous. */
export function githubClient(repository, token) {
  const read = githubReader(repository, token)
  const write = async (method, path, body) => {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      },
    )
    if (!response.ok)
      throw new Error(
        `GitHub ${method} ${path}: HTTP ${response.status}. Inspect remote state before retrying.`,
      )
    return response.status === 204 ? null : response.json()
  }
  return {read, write}
}
