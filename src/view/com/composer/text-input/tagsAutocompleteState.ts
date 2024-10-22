import {account} from '#/storage'

export type Result = {
  value: string
}

export type Model = {
  search(query: string): Promise<Result[]>
  save(tag: string): void
}

export function tagAutocompleteModel({
  currentDid,
}: {
  currentDid: string
}): Model {
  let recentTags = account.get([currentDid, 'recentTags']) || []

  return {
    async search(query: string) {
      if (!query) return [{value: query}]
      return [
        {value: query},
        ...recentTags.filter(t => t.value.includes(query)),
      ]
    },
    save(tag: string) {
      recentTags = [
        {value: tag},
        ...recentTags.filter(t => t.value !== tag),
      ].slice(0, 40)
      account.set([currentDid, 'recentTags'], recentTags)
    },
  }
}
