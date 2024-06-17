import {Selectable} from 'kysely'

export type DbSchema = {
  link: Link
}

export interface Link {
  id: string
  type: LinkType
  path: string
}

export enum LinkType {
  StarterPack = 1,
}

export type LinkEntry = Selectable<Link>
