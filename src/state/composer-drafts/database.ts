import {DraftEntry, UnknownDraftEntry} from './database.types'

export const listDrafts = async ({
  cursor: _cursor,
  limit: _limit = 50,
}: {
  limit?: number
  cursor?: string
}): Promise<{
  cursor: string | undefined
  entries: UnknownDraftEntry[]
}> => {
  throw new Error(`unimplemented`)
}

export const putDraft = async (_entry: DraftEntry): Promise<void> => {
  throw new Error(`unimplemented`)
}

export const removeDraft = async (_entryId: string): Promise<void> => {
  throw new Error(`unimplemented`)
}
