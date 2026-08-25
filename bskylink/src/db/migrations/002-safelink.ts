import {type Kysely, sql} from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('safelink_rule')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('eventType', 'varchar', col => col.notNull())
    .addColumn('url', 'varchar', col => col.notNull())
    .addColumn('pattern', 'varchar', col => col.notNull())
    .addColumn('action', 'varchar', col => col.notNull())
    .addColumn('createdAt', 'timestamptz', col => col.notNull())
    .execute()

  await db.schema
    .createTable('safelink_cursor')
    .addColumn('id', 'bigserial', col => col.notNull())
    .addColumn('cursor', 'varchar', col => col.notNull())
    .addColumn('updatedAt', 'timestamptz', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('safelink_rule_url_pattern_created_at_idx')
    .on('safelink_rule')
    .expression(sql`"url", "pattern", "createdAt" DESC`)
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex('safelink_rule_url_pattern_created_at_idx')
    .execute()
  await db.schema.dropTable('safelink_rule').execute()
  await db.schema.dropTable('safelink_cursor').execute()
}
