import {sqliteTable,text,integer} from "drizzle-orm/sqlite-core";
export * from './auth-schema';
export const financialDocuments=sqliteTable('financial_documents',{
 userId:text('user_id').primaryKey(),
 data:text('data').notNull(),
 revision:integer('revision').notNull().default(0),
 updatedAt:text('updated_at').notNull(),
});
export const aiUsage=sqliteTable('ai_usage',{
 userId:text('user_id').primaryKey(),
 day:text('day').notNull(),
 count:integer('count').notNull().default(0),
});

/**
 * Define your database schema here, then apply it with `bun run db:push`
 * (from packages/web). Re-export any generated schema from this file
 * (e.g. Better Auth's auth-schema.ts) so drizzle generates complete migrations.
 * Table patterns and conventions: skills/app/references/api.md
 */
