import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const c = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sqlFile = process.argv[2];
const when = process.argv[3] ? Number(process.argv[3]) : Date.now();

if (!sqlFile) {
  console.error('usage: apply-migration.mjs <migration.sql> [timestamp_ms]');
  process.exit(1);
}

const sql = readFileSync(sqlFile, 'utf8');
const hash = crypto.createHash('sha256').update(sql).digest('hex');

// Already applied?
const found = await c.execute({
  sql: 'SELECT id FROM __drizzle_migrations WHERE hash = ?',
  args: [hash],
});
if (found.rows.length > 0) {
  console.log(`Already applied (hash ${hash.slice(0, 16)}...). Nothing to do.`);
  process.exit(0);
}

// Split on --> statement-breakpoint and run each
const statements = sql
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Applying ${statements.length} statements from ${sqlFile}`);
let applied = 0, skipped = 0;
for (let i = 0; i < statements.length; i++) {
  const firstLine = statements[i].split('\n')[0].slice(0, 80);
  try {
    await c.execute(statements[i]);
    applied++;
    console.log(`  [OK] ${i+1}/${statements.length} ${firstLine}`);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('already exists')) {
      skipped++;
      console.log(`  [SKIP already exists] ${firstLine}`);
    } else {
      console.log(`  [FAIL] ${firstLine}`);
      console.log(`    -> ${msg.slice(0, 200)}`);
      process.exit(1);
    }
  }
}

// Record in migrations table
await c.execute({
  sql: 'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
  args: [hash, when],
});
console.log(`\n${applied} applied, ${skipped} skipped. Recorded hash ${hash.slice(0, 16)}...`);

// Verify
console.log('\nTables in prod:');
const r = await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
for (const row of r.rows) console.log('  -', row.name);
