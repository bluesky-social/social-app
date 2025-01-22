import {Selectable} from 'kysely'

export type DbSchema = {
  link: Link
}

interface Link {
  id: string
  type: LinkType
  path: string
}

export enum LinkType {
  StarterPack = 1,
}

type LinkEntry = Selectable<Link>
