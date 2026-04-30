import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = process.env.TURSO_DATABASE_URL
  ? createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : null;

declare const globalThis: { __db?: ReturnType<typeof drizzle> };

export const db = globalThis.__db ?? (client ? drizzle(client, { schema }) : (null as any));

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db;
}
