import {type Kysely} from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('safelink_rule')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('eventType', 'varchar', col => col.notNull())
    .addColumn('url', 'varchar', col => col.notNull())
    .addColumn('pattern', 'varchar', col => col.notNull())
    .addColumn('action', 'varchar', col => col.notNull())
    .addColumn('reason', 'varchar', col => col.notNull())
    .addColumn('createdBy', 'varchar', col => col.notNull())
    .addColumn('createdAt', 'timestamptz', col => col.notNull())
    .addColumn('comment', 'varchar', col => col.notNull())
    .execute()

  await db.schema
    .createTable('safelink_cursor')
    .addColumn('id', 'bigserial', col => col.primaryKey())
    .addColumn('cursor', 'varchar', col => col.notNull())
    .addColumn('createdAt', 'timestamptz', col => col.notNull())
    .execute()

  await db.schema
    .createIndex('safelink_rule_url_pattern_idx')
    .on('safelink_rule')
    .columns(['url', 'pattern'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('safelink_rule_url_pattern_idx').execute()
  await db.schema.dropTable('safelink_rule').execute()
  await db.schema.dropTable('safelink_cursor').execute()
}
