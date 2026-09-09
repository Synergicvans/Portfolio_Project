import {sqliteTable, text, integer, index} from 'drizzle-orm/sqlite-core';
export const answers = sqliteTable('answers', {
  key: text('key').primaryKey(),
  answer: text('answer').notNull(),
  expires: integer('expires').notNull()
},table=>[index('answers_expires_idx').on(table.expires)]);
export const limits = sqliteTable('limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  expires: integer('expires').notNull()
},table=>[index('limits_expires_idx').on(table.expires)]);
export const locks = sqliteTable('locks', {
  key: text('key').primaryKey(),
  expires: integer('expires').notNull()
});
