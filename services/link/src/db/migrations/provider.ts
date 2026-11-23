import {Migration, MigrationProvider} from 'kysely'

export class DbMigrationProvider implements MigrationProvider {
  constructor(private migrations: Record<string, Migration>) {}
  async getMigrations(): Promise<Record<string, Migration>> {
    return this.migrations
  }
}
