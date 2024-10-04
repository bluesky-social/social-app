import {ComposerImage} from '#/state/gallery'
import {ComAtprotoRepoStrongRef} from '@atproto/api'

type ResolvedExternalLink = {
  type: 'external'
  uri: string
  title: string
  description: string
  thumb: ComposerImage | undefined
}

type ResolvedRecord = {
  type: 'record'
  record: ComAtprotoRepoStrongRef.Main
}

type ResolvedLink = ResolvedExternalLink | ResolvedRecord

export async function resolveLink(uri: string): Promise<ResolvedLink> {
  // TODO
}

export async function resolveRecord(
  uri: string,
): Promise<ComAtprotoRepoStrongRef.Main> {
  // TODO
}

export async function resolveGif(gif: Gif): Promise<ResolvedExternalLink> {
  // TODO
}
