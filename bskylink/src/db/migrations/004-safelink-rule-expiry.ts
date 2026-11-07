import {type Kysely} from 'kysely'

export async function up(db: Kysely<{safelink_rule: {}}>): Promise<void> {
  await db.schema
    .alterTable('safelink_rule')
    .addColumn('expiresAt', 'varchar')
    .execute()
}

export async function down(db: Kysely<{safelink_rule: {}}>): Promise<void> {
  await db.schema.alterTable('safelink_rule').dropColumn('expiresAt').execute()
}
